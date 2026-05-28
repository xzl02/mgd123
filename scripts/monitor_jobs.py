#!/usr/bin/env python3
"""Best-effort job announcement monitor for the public static site."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date, datetime
from email.message import EmailMessage
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeout
import hashlib
import html
import json
import multiprocessing as mp
import os
from pathlib import Path
import re
import smtplib
import ssl
import sys
import time
from typing import Iterable
from urllib.parse import parse_qs, quote_plus, unquote, urljoin, urlparse
from urllib.request import Request, urlopen
import base64


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "monitor_config.json"
DATA_DIR = ROOT / "mgd123" / "data"
OUTPUT_PATH = DATA_DIR / "announcements.json"
STATE_PATH = ROOT / ".monitor_state.json"
MAX_SECONDS = 70


@dataclass
class Announcement:
    id: str
    title: str
    source: str
    url: str
    verify_url: str
    matched_keywords: list[str]
    score: int
    found_at: str
    deadline: str
    confidence: str
    status_note: str


def load_json(path: Path, default):
    if not path.exists():
      return default
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _fetch_direct(url: str, timeout: int) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 job-monitor; +https://github.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    for encoding in ("utf-8", "gb18030", "big5"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def _fetch_worker(url: str, timeout: int, queue: mp.Queue) -> None:
    try:
        queue.put(("ok", _fetch_direct(url, timeout)))
    except Exception as exc:
        queue.put(("err", repr(exc)))


def fetch(url: str, timeout: int = 8) -> str:
    queue: mp.Queue = mp.Queue()
    proc = mp.Process(target=_fetch_worker, args=(url, timeout, queue))
    proc.start()
    proc.join(timeout + 3)
    if proc.is_alive():
        proc.terminate()
        proc.join(2)
        raise TimeoutError(f"Timed out fetching {url}")
    if queue.empty():
        raise RuntimeError(f"No response while fetching {url}")
    status, payload = queue.get()
    if status == "ok":
        return payload
    raise RuntimeError(payload)


def clean_text(text: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_links(page: str, base_url: str) -> Iterable[tuple[str, str]]:
    pattern = re.compile(r"<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>([\s\S]*?)</a>", re.I)
    for href, label_html in pattern.findall(page):
        label = clean_text(label_html)
        if not label:
            continue
        href = html.unescape(href)
        url = normalize_url(urljoin(base_url, href))
        if not url:
            continue
        yield label[:160], url


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return ""
    host = parsed.netloc.lower()
    if "bing.com" in host and parsed.path.startswith("/ck/"):
        query = parse_qs(parsed.query)
        raw = query.get("u", [""])[0]
        decoded = decode_bing_url(raw)
        return decoded
    if any(blocked in host for blocked in ("bing.com", "microsoft.com")):
        return ""
    return url


def decode_bing_url(raw: str) -> str:
    if not raw:
        return ""
    raw = unquote(raw)
    if raw.startswith("a1"):
        raw = raw[2:]
    padding = "=" * (-len(raw) % 4)
    try:
        decoded = base64.urlsafe_b64decode(raw + padding).decode("utf-8", errors="ignore")
    except Exception:
        return ""
    parsed = urlparse(decoded)
    if parsed.scheme in ("http", "https"):
        return decoded
    return ""


def verify_search_url(title: str) -> str:
    return "https://www.bing.com/search?q=" + quote_plus(title)


def current_year() -> int:
    return int(os.environ.get("MONITOR_YEAR", str(date.today().year)))


def parse_deadline(text: str) -> str:
    patterns = [
        r"(?:截止|截至|报名截止|投递截止|简历投递截止|申请截止)[^\d]{0,12}(\d{4})[年\-/\.](\d{1,2})[月\-/\.](\d{1,2})",
        r"(\d{4})[年\-/\.](\d{1,2})[月\-/\.](\d{1,2})[日号]?[^\n]{0,12}(?:截止|截至)",
        r"(?:截止|截至|报名截止|投递截止)[^\d]{0,12}(\d{1,2})[月\-/\.](\d{1,2})[日号]?"
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        groups = match.groups()
        try:
            if len(groups) == 3:
                year, month, day = map(int, groups)
            else:
                year = current_year()
                month, day = map(int, groups)
            return date(year, month, day).isoformat()
        except ValueError:
            continue
    return ""


def is_deadline_expired(deadline: str) -> bool:
    if not deadline:
        return False
    try:
        return date.fromisoformat(deadline) < date.today()
    except ValueError:
        return False


def year_penalty_and_note(text: str) -> tuple[int, str, bool]:
    years = {int(y) for y in re.findall(r"20\d{2}", text)}
    if not years:
        return 0, "未识别年份，需核验", False
    year = current_year()
    if any(y >= year for y in years):
        return 4, f"包含当前或未来年份：{', '.join(map(str, sorted(years)))}", False
    if any(y == year - 1 for y in years):
        return 0, f"包含上一年度年份：{', '.join(map(str, sorted(years)))}，需核验是否仍有效", False
    return -100, f"疑似旧公告年份：{', '.join(map(str, sorted(years)))}", True


def source_confidence(source: str, url: str, deadline: str) -> str:
    official_markers = [
        "sgcc.com.cn",
        "chnenergy.com.cn",
        "10086.cn",
        "chinatelecom.com.cn",
        "chinatowercom.cn",
        "iguopin.com",
        "job.mohrss.gov.cn",
        "spic.com.cn"
    ]
    if deadline and any(marker in url for marker in official_markers):
        return "高可信"
    if any(marker in url for marker in official_markers):
        return "官方来源待核验"
    if deadline:
        return "有截止日期待核验"
    return "待核验线索"


def is_generic_nav_title(title: str) -> bool:
    normalized = re.sub(r"\s+", "", title)
    generic_titles = {
        "招聘",
        "招聘公告",
        "招聘公示",
        "校园招聘",
        "社会招聘",
        "人才招聘",
        "加入我们",
        "招聘信息",
        "公告",
        "公示"
    }
    return normalized in generic_titles


def score_item(title: str, url: str, keywords: list[str], high_value_units: list[str]) -> tuple[int, list[str], str, str, bool]:
    text = f"{title} {url}"
    matched = [kw for kw in keywords if kw in text]
    unit_hits = [unit for unit in high_value_units if unit in text]
    score = len(matched) + len(unit_hits) * 3
    if "青海" in text:
        score += 4
    if "招聘" in text or "校园招聘" in text or "高校毕业生" in text:
        score += 4
    year_score, year_note, reject = year_penalty_and_note(text)
    score += year_score
    deadline = parse_deadline(text)
    if deadline:
        score += 3
    if is_deadline_expired(deadline):
        reject = True
        year_note = f"已过截止日期：{deadline}"
    return score, matched + unit_hits, deadline, year_note, reject


def item_id(title: str, url: str) -> str:
    return hashlib.sha256(f"{title}|{url}".encode("utf-8")).hexdigest()[:16]


def collect_from_source(source: dict, config: dict) -> list[Announcement]:
    url = source["url"]
    try:
        page = fetch(url, timeout=5)
    except Exception as exc:
        print(f"Fetch failed: {url}: {exc}", file=sys.stderr)
        return []

    items: list[Announcement] = []
    for title, link in extract_links(page, url):
        if is_generic_nav_title(title):
            continue
        score, matched, deadline, note, reject = score_item(title, link, config["keywords"], config["high_value_units"])
        if source.get("official"):
            score += 5
            if note == "未识别年份，需核验":
                note = "官方入口线索，未识别年份，需打开公告核验"
        if reject or score < 7:
            continue
        items.append(
            Announcement(
                id=item_id(title, link),
                title=title,
                source=source["name"],
                url=link,
                verify_url=verify_search_url(title),
                matched_keywords=matched[:12],
                score=score,
                found_at=os.environ.get("GITHUB_RUN_STARTED_AT", ""),
                deadline=deadline,
                confidence=source_confidence(source["name"], link, deadline),
                status_note=note,
            )
        )
    return items


def collect_from_search(config: dict) -> list[Announcement]:
    items: list[Announcement] = []
    for query in config["search_queries"][:4]:
        items.extend(collect_from_query(query, config))
    return items


def collect_from_query(query: str, config: dict) -> list[Announcement]:
    url = "https://www.bing.com/search?q=" + quote_plus(query)
    try:
        page = fetch(url, timeout=6)
    except Exception as exc:
        print(f"Search failed: {query}: {exc}", file=sys.stderr)
        return []

    items: list[Announcement] = []
    for title, link in extract_links(page, url):
        if is_generic_nav_title(title):
            continue
        score, matched, deadline, note, reject = score_item(title, link, config["keywords"], config["high_value_units"])
        if reject or score < 8:
            continue
        items.append(
            Announcement(
                id=item_id(title, link),
                title=title,
                source=f"Bing: {query}",
                url=link,
                verify_url=verify_search_url(title),
                matched_keywords=matched[:12],
                score=score,
                found_at=os.environ.get("GITHUB_RUN_STARTED_AT", ""),
                deadline=deadline,
                confidence=source_confidence(f"Bing: {query}", link, deadline),
                status_note=note,
            )
        )
    return items


def collect_parallel(config: dict) -> list[Announcement]:
    tasks = []
    collected: list[Announcement] = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        for source in config.get("sources", [])[:12]:
            tasks.append(executor.submit(collect_from_source, source, config))
        for query in config.get("search_queries", [])[:6]:
            tasks.append(executor.submit(collect_from_query, query, config))
        try:
            for future in as_completed(tasks, timeout=MAX_SECONDS):
                try:
                    collected.extend(future.result())
                except Exception as exc:
                    print(f"Monitor task failed: {exc}", file=sys.stderr)
        except FuturesTimeout:
            print("Monitor time budget reached; unfinished tasks skipped.", file=sys.stderr)
            for future in tasks:
                future.cancel()
    return collected


def dedupe(items: Iterable[Announcement]) -> list[Announcement]:
    best: dict[str, Announcement] = {}
    for item in items:
        existing = best.get(item.id)
        if existing is None or item.score > existing.score:
            best[item.id] = item
    return sorted(best.values(), key=lambda x: x.score, reverse=True)[:80]


def fallback_official_entries(config: dict) -> list[Announcement]:
    entries: list[Announcement] = []
    for source in config.get("sources", [])[:10]:
        title = f"{source['name']} 官方招聘入口"
        url = source["url"]
        entries.append(
            Announcement(
                id=item_id(title, url),
                title=title,
                source=source["name"],
                url=url,
                verify_url=verify_search_url(f"{source['name']} 青海 招聘 电子信息 自动化 新能源"),
                matched_keywords=["official", "qinghai", "jobs"],
                score=6,
                found_at=os.environ.get("GITHUB_RUN_STARTED_AT", ""),
                deadline="",
                confidence="Official entry",
                status_note="No specific new announcement was captured. Use this official entry for manual verification.",
            )
        )
    return entries


def send_email(new_items: list[Announcement]) -> None:
    qq_email = os.environ.get("QQ_EMAIL")
    qq_code = os.environ.get("QQ_SMTP_CODE")
    notify_to = os.environ.get("NOTIFY_TO") or qq_email
    if not qq_email or not qq_code or not notify_to or not new_items:
        return

    lines = ["发现新的青海央国企招聘线索：", ""]
    for item in new_items[:10]:
        lines.append(f"- {item.title}")
        lines.append(f"  来源：{item.source}")
        lines.append(f"  可信度：{item.confidence}")
        lines.append(f"  截止时间：{item.deadline or '未识别，需打开官方公告核验'}")
        lines.append(f"  说明：{item.status_note}")
        lines.append(f"  链接：{item.url}")
        lines.append(f"  搜索核验：{item.verify_url}")
        lines.append("")

    msg = EmailMessage()
    msg["Subject"] = f"果冻的求职之路：发现 {len(new_items)} 条招聘线索"
    msg["From"] = qq_email
    msg["To"] = notify_to
    msg.set_content("\n".join(lines))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.qq.com", 465, context=context) as server:
        server.login(qq_email, qq_code)
        server.send_message(msg)


def main() -> int:
    config = load_json(CONFIG_PATH, {})
    previous = load_json(STATE_PATH, {"seen_ids": []})
    seen_ids = set(previous.get("seen_ids", []))

    collected = collect_parallel(config)

    current = dedupe(collected)
    if not current:
        current = fallback_official_entries(config)
    new_items = [item for item in current if item.id not in seen_ids]

    output = {
        "updated_at": os.environ.get("GITHUB_RUN_STARTED_AT", ""),
        "count": len(current),
        "items": [asdict(item) for item in current],
        "note": "Auto monitor is best-effort. Search results must be verified against official announcements."
    }
    write_json(OUTPUT_PATH, output)
    write_json(STATE_PATH, {"seen_ids": sorted({*seen_ids, *(item.id for item in current)})})

    if new_items:
        print(f"New items: {len(new_items)}")
        try:
            send_email(new_items)
        except Exception as exc:
            print(f"Email send failed: {exc}", file=sys.stderr)
    else:
        print("No new items.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
