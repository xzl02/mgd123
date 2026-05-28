const defaultModel = process.env.AI_MODEL || "deepseek-chat";
const apiBase = process.env.AI_API_BASE || "https://api.deepseek.com";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    response.status(501).json({
      error: "ai_key_missing",
      message: "服务端还没有配置 AI_API_KEY，前端会退回模拟生成。"
    });
    return;
  }

  try {
    const payload = request.body || {};
    const novel = payload.novel || {};
    const chapterNo = Number(payload.chapterNo) || 1;
    const prompt = buildPrompt(novel, chapterNo);

    const aiResponse = await fetch(`${apiBase.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: defaultModel,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: "你是长篇网文写作 Agent。输出 JSON，不要输出 Markdown。"
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      response.status(aiResponse.status).json({ error: "ai_request_failed", detail: text.slice(0, 1200) });
      return;
    }

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseJsonContent(content);
    response.status(200).json({
      title: parsed.title || `第${chapterNo}章`,
      body: parsed.body || content,
      quality: parsed.quality || [],
      state: parsed.state || null,
      trace: {
        model: defaultModel,
        provider: apiBase,
        promptTokens: data?.usage?.prompt_tokens || 0,
        completionTokens: data?.usage?.completion_tokens || 0
      }
    });
  } catch (error) {
    response.status(500).json({ error: "server_error", message: error.message });
  }
}

function buildPrompt(novel, chapterNo) {
  return JSON.stringify({
    task: "生成下一章正文，并给出质量检查和状态更新摘要。",
    output_schema: {
      title: "章节标题",
      body: "章节正文",
      quality: [{ name: "检查项", status: "PASS/WARN/FAIL", note: "说明" }],
      state: { location: "地点", event: "本章事件", tags: ["标签"] }
    },
    novel: {
      title: novel.title,
      genre: novel.genre,
      premise: novel.premise,
      outline: novel.outline,
      current: novel.current,
      volumes: novel.volumes,
      blocks: novel.blocks,
      memories: novel.entities,
      recentChapters: (novel.chapters || []).slice(-3)
    },
    chapterNo
  });
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}
