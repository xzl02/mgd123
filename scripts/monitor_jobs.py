#!/usr/bin/env python3
"""Best-effort job announcement monitor for the public static site."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from email.message import EmailMessage
import hashlib
import html
import json
import os
from pathlib import Path
import re
import smtplib
import ssl
import sys
from typing import Iterable
from urllib.parse import quote_plus, urljoin
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "monitor_config.json"
DATA_DIR = ROOT / "mgd123" / "data"
OUTPUT_PATH = DATA_DIR / "announcements.json"
STATE_PATH = ROOT / ".monitor_state.json"


@dataclass
class Announcement:
    id: str
    title: str
    source: str
    url: str
    matched_keywords: list[str]
    score: int
    found_at: str


def load_json(path: Path, default):
    if not path.exists():
      return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch(url: str, timeout: int = 18) -> str:
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
        url = urljoin(base_url, href)
        yield label[:160], url


def score_item(title: str, url: str, keywords: list[str], high_value_units: list[str]) -> tuple[int, list[str]]:
    text = f"{title} {url}"
    matched = [kw for kw in keywords if kw in text]
    unit_hits = [unit for unit in high_value_units if unit in text]
    score = len(matched) + len(unit_hits) * 3
    if "青海" in text:
        score += 4
    if "招聘" in text or "校园招聘" in text or "高校毕业生" in text:
        score += 4
    return score, matched + unit_hits


def item_id(title: str, url: str) -> str:
    return hashlib.sha256(f"{title}|{url}".encode("utf-8")).hexdigest()[:16]


def collect_from_source(source: dict, config: dict) -> list[Announcement]:
    url = source["url"]
    try:
        page = fetch(url)
    except Exception as exc:
        print(f"Fetch failed: {url}: {exc}", file=sys.stderr)
        return []

    items: list[Announcement] = []
    for title, link in extract_links(page, url):
        score, matched = score_item(title, link, config["keywords"], config["high_value_units"])
        if score < 7:
            continue
        items.append(
            Announcement(
                id=item_id(title, link),
                title=title,
                source=source["name"],
                url=link,
                matched_keywords=matched[:12],
                score=score,
                found_at=os.environ.get("GITHUB_RUN_STARTED_AT", ""),
            )
        )
    return items


def collect_from_search(config: dict) -> list[Announcement]:
    items: list[Announcement] = []
    for query in config["search_queries"]:
        url = "https://www.bing.com/search?q=" + quote_plus(query)
        try:
            page = fetch(url)
        except Exception as exc:
            print(f"Search failed: {query}: {exc}", file=sys.stderr)
            continue
        for title, link in extract_links(page, url):
            score, matched = score_item(title, link, config["keywords"], config["high_value_units"])
            if score < 8:
                continue
            items.append(
                Announcement(
                    id=item_id(title, link),
                    title=title,
                    source=f"Bing: {query}",
                    url=link,
                    matched_keywords=matched[:12],
                    score=score,
                    found_at=os.environ.get("GITHUB_RUN_STARTED_AT", ""),
                )
            )
    return items


def dedupe(items: Iterable[Announcement]) -> list[Announcement]:
    best: dict[str, Announcement] = {}
    for item in items:
        existing = best.get(item.id)
        if existing is None or item.score > existing.score:
            best[item.id] = item
    return sorted(best.values(), key=lambda x: x.score, reverse=True)[:80]


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
        lines.append(f"  链接：{item.url}")
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

    collected: list[Announcement] = []
    for source in config.get("sources", []):
        collected.extend(collect_from_source(source, config))
    collected.extend(collect_from_search(config))

    current = dedupe(collected)
    new_items = [item for item in current if item.id not in seen_ids]

    output = {
        "updated_at": os.environ.get("GITHUB_RUN_STARTED_AT", ""),
        "count": len(current),
        "items": [asdict(item) for item in current],
        "note": "自动监控为 best-effort，第三方搜索结果必须回到官方来源核验。"
    }
    write_json(OUTPUT_PATH, output)
    write_json(STATE_PATH, {"seen_ids": sorted({*seen_ids, *(item.id for item in current)})})

    if new_items:
        print(f"New items: {len(new_items)}")
        send_email(new_items)
    else:
        print("No new items.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
