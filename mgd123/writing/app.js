const storageKey = "songyan-novel-workbench-v1";

const seed = {
  activeBookId: "book_001",
  activePromptId: "prompt_style",
  activeRequestId: "req_001",
  cloud: {
    status: "LOCAL_PREVIEW",
    domain: "judong-writing.vercel.app",
    accessModes: [
      { name: "本地预览", status: "当前", note: "只在这台电脑浏览器里保存数据，适合设计和测试。" },
      { name: "公开静态站", status: "可部署", note: "任何人能打开页面，但数据仍在各自浏览器本地。" },
      { name: "云端账号站", status: "目标", note: "账号、小说、章节、记忆库写入数据库，才是真正多人可用。" }
    ],
    deployChecklist: [
      { name: "GitHub 仓库", done: true, note: "用于托管代码和触发自动部署。" },
      { name: "Vercel 项目", done: false, note: "承载公开网站和服务端 API。" },
      { name: "Supabase 数据库", done: false, note: "保存用户、小说、章节、记忆实体、Trace。" },
      { name: "服务端 AI 密钥", done: false, note: "密钥只放环境变量，不下发到浏览器。" },
      { name: "权限策略", done: false, note: "每个用户只能读写自己的小说项目。" }
    ],
    architecture: [
      ["前端", "书架、工作台、提示词、Trace、账号界面"],
      ["API", "生成章节、质量检查、状态更新、导出任务"],
      ["数据库", "profiles / novels / chapters / memories / requests"],
      ["存储", "导出文件、长 Trace blob、封面资源"],
      ["任务队列", "批量生成章节、定时快照、失败重试"]
    ],
    featureMatrix: [
      { name: "书架与工作台", local: "可用", cloud: "同步到数据库" },
      { name: "章节编辑", local: "可用", cloud: "多端同步" },
      { name: "记忆系统", local: "模拟", cloud: "由 StateUpdateAgent 写入" },
      { name: "AI 生成", local: "模拟", cloud: "服务端调用模型" },
      { name: "多人使用", local: "不可共享", cloud: "账号隔离" },
      { name: "费用控制", local: "无", cloud: "按用户限额和日志统计" }
    ]
  },
  account: {
    loggedIn: false,
    name: "果冻",
    email: "2197141693@qq.com",
    role: "站长",
    quota: {
      novels: 3,
      chapters: 120,
      aiRuns: 50,
      storage: "200 MB"
    },
    team: [
      { name: "果冻", email: "2197141693@qq.com", role: "站长", status: "OWNER" }
    ]
  },
  requests: [
    {
      id: "req_001",
      time: "2026-05-28 17:06",
      agent: "WriterAgent",
      status: "PASS",
      model: "deepseek-v4-flash",
      latency: "2.4s",
      tokens: 4821,
      text: "生成第 1 章，完成状态更新与质量评估。",
      prompt: "根据卷纲和剧情块生成正文，保持压抑开局和反击钩子。",
      output: "第1章正文已生成，质量检查通过。"
    }
  ],
  pipeline: [
    { id: "brainstorm", name: "脑洞共创", agent: "BrainstormAgent", input: "立项问卷", output: "卖点与冲突", status: "READY" },
    { id: "outline", name: "大纲", agent: "OutlineAgent", input: "卖点", output: "全书大纲", status: "READY" },
    { id: "volume", name: "卷纲", agent: "VolumeOutlineAgent", input: "全书大纲", output: "卷目标", status: "READY" },
    { id: "block", name: "剧情块", agent: "BlockOutlineAgent", input: "卷目标", output: "章节块", status: "READY" },
    { id: "writer", name: "正文", agent: "WriterAgent", input: "剧情块", output: "章节正文", status: "READY" },
    { id: "logic", name: "逻辑检查", agent: "LogicCheckAgent", input: "章节正文", output: "问题清单", status: "READY" },
    { id: "state", name: "状态更新", agent: "StateUpdateAgent", input: "正文+记忆", output: "状态库", status: "READY" }
  ],
  queue: [
    { id: "job_001", range: "第2-10章", type: "批量生成", status: "WAITING", progress: 0, retry: 2 },
    { id: "job_002", range: "第1章", type: "质量复检", status: "DONE", progress: 100, retry: 0 }
  ],
  rules: [
    { id: "rule_001", name: "人物动机", level: "高", enabled: true, text: "角色行动必须由欲望、恐惧、利益或关系触发，不能只为了推动剧情。" },
    { id: "rule_002", name: "升级限制", level: "高", enabled: true, text: "能力提升必须付出代价，有资源来源，有短期限制。" },
    { id: "rule_003", name: "伏笔回收", level: "中", enabled: true, text: "新伏笔必须写入状态库，超过 20 章未回收则提醒。" },
    { id: "rule_004", name: "文风一致", level: "中", enabled: true, text: "同一本书的叙述密度、对白比例和情绪底色保持稳定。" }
  ],
  generationConfig: {
    max_retries: 5,
    word_min: 2000,
    word_target: 3000,
    word_max: 5000,
    writing_style: "口语化强代入",
    logic_check_strict: true,
    plan_chapter_count: 2
  },
  memorySystem: {
    snapshot_interval: 50,
    archive_interval: 100,
    entity_inactive_window: 100,
    cooling_window: 6,
    cold_window: 12,
    recent_full_chapters: 3,
    recent_summary_chapters: 5,
    recent_key_info_chapters: 8,
    max_active_foreshadows: 10
  },
  agentInjection: {
    volume_outline: {
      "大纲": true,
      "当前卷名": true,
      "当前卷章节范围": true,
      "最近状态追踪": true,
      "活跃实体摘要": false,
      "未回收伏笔": false
    },
    block_outline: {
      "大纲": true,
      "本块对应剧情块": true,
      "本卷基本信息": true,
      "前序剧情块提要": true,
      "活跃实体摘要": true,
      "冷却实体摘要": true,
      "最近状态追踪": true,
      "未回收伏笔": true
    },
    writer: {
      "大纲": true,
      "本章块内写作指引": true,
      "本卷基本信息": true,
      "最近状态追踪": true,
      "活跃实体": true,
      "已解锁世界秘闻": true,
      "终结实体警告": true,
      "完整前文": true,
      "冷却实体摘要": true
    },
    quality_check: {
      "最近状态追踪": true,
      "活跃实体": true,
      "冷却实体摘要": true,
      "完整前文": true,
      "前文摘要": false
    },
    state_update: {
      "活跃实体": true,
      "冷却实体摘要": true,
      "最近状态追踪": true,
      "上章摘要": false
    }
  },
  projectTree: [
    { name: "config", files: ["generation_config.json", "llm_registry.json", "word_state.json"] },
    { name: "agent_prompt", files: ["writer/exec_guide.md", "logic_check/exec_guide.md", "state_update/exec_guide.md", "volume_outline/exec_guide.md", "block_outline/guide.md"] },
    { name: "work_space", files: ["novels/", "Trace/blobs/", "brainstorm_sessions/", "outline_draft_sessions/"] }
  ],
  traces: [
    { id: "trace_writer_001", type: "writer_request", agent: "WriterAgent", file: "Trace/blobs/writer_request.json", summary: "正文生成请求，包含章节卡、块故事、最近状态、活跃实体。" },
    { id: "trace_quality_001", type: "quality_check_response", agent: "LogicCheckAgent", file: "Trace/blobs/quality_check_response.json", summary: "质量检查响应，输出 pass / rewrite / regenerate 和问题清单。" },
    { id: "trace_state_001", type: "state_update_response", agent: "StateUpdateAgent", file: "Trace/blobs/state_update_response.json", summary: "状态更新响应，写入角色、物品、地点、阵营与伏笔变化。" }
  ],
  agents: [
    ["脑洞共创", "deepseek-v4-flash", "outline_draft_brainstorm"],
    ["大纲 Agent", "deepseek-v4-flash", "OutlineAgent"],
    ["卷纲 Agent", "deepseek-v4-flash", "VolumeOutlineAgent"],
    ["块纲 Agent", "deepseek-v4-flash", "BlockOutlineAgent"],
    ["正文写作 Agent", "deepseek-v4-flash", "WriterAgent"],
    ["逻辑检查 Agent", "deepseek-v4-flash", "LogicCheckAgent"],
    ["状态更新 Agent", "deepseek-v4-flash", "StateUpdateAgent"]
  ],
  models: [
    { name: "deepseek-v4-flash", provider: "DeepSeek", role: "便宜快速，适合大纲/正文草稿", status: "可用" },
    { name: "claude-sonnet", provider: "Anthropic", role: "适合长文本润色和逻辑检查", status: "未配置" },
    { name: "gpt-4.1-mini", provider: "OpenAI", role: "适合结构化整理和工具调用", status: "未配置" }
  ],
  prompts: [
    {
      id: "prompt_style",
      name: "文风控制提示词.md",
      enabled: true,
      body: "Writer Agent - 文风规则\n\n避免解释性句式过载。多用动作、对话、具体感官细节推进剧情。每章必须有明确冲突、阶段变化和下一章钩子。"
    },
    {
      id: "prompt_logic",
      name: "规则提示词.md",
      enabled: false,
      body: "Logic Agent - 检查规则\n\n检查人物动机是否一致，战力变化是否有铺垫，地点、时间、道具和状态是否前后冲突。"
    },
    {
      id: "prompt_character",
      name: "人设提示词.md",
      enabled: false,
      body: "Character Agent - 人设规则\n\n角色必须有欲望、恐惧、代价和行动方式。不要只写标签，要能影响剧情选择。"
    }
  ],
  books: [
    {
      id: "book_001",
      title: "逆天废柴：从炼气打到大乘",
      genre: "玄幻 / 修仙",
      trope: "凡人逆袭",
      targetChapters: 400,
      wordsPerChapter: 8500,
      stylePower: 7,
      logicPower: 8,
      premise: "林越因废灵根被逐出外门药田，却在濒死时获得万界吞天诀，从炼气一路突破至大乘。",
      questionnaire: {
        "故事卖点": "废灵根不是弱点，而是能吞噬万法的特殊体质。",
        "主角目标": "活下去，洗掉废物之名，查清废灵根来源。",
        "核心爽点": "被轻视、被压迫、再用对方规则反杀。",
        "情绪底色": "压抑开局，逐步转为克制、锋利、可信的变强。",
        "禁写内容": "不要无铺垫秒杀，不要让角色只为打脸而行动。",
        "读者期待": "升级、秘境、宗门斗争、伏笔回收、感情慢热。"
      },
      outline: "卷1：废柴崛起。主角被欺压、获得功法、完成第一次反击。\n卷2：宗门暗潮。进入外门核心视野，发现废灵根背后另有隐秘。\n卷3：青州风雷。离开宗门，进入更大的修行地图。",
      volumes: [
        { name: "卷1 · 废柴崛起", range: "第1-25章", hook: "在青阳宗外门，林越因废灵根被内门弟子欺辱至濒死，濒临绝望之际意外激活万界吞天诀。" },
        { name: "卷2 · 宗门暗潮", range: "第26-80章", hook: "林越进入外门前十，却发现每个废灵根弟子都曾被同一批长老盯上。" }
      ],
      blocks: [
        { volume: "卷1", range: "第1-4章", title: "戒中残魂", status: "运行中", goal: "林越获得功法，确认废灵根另有隐情，并埋下第一次反击。" },
        { volume: "卷1", range: "第5-9章", title: "外门小比", status: "待处理", goal: "用低阶资源突破，引出剑无尘的第一次正面压迫。" },
        { volume: "卷1", range: "第10-15章", title: "药田秘洞", status: "待处理", goal: "发现青阳宗早年被封存的吞灵阵残片。" }
      ],
      chapters: [
        {
          title: "第1章 · 谁的拳头硬",
          body: "太阳当头，晒得地面发白。\n\n林越跪在药田边上，手里的锄头磨得掌心起泡。\n\n三个月了。\n\n自从被判定为废灵根，他就被扔到了外门药田。跟那些干杂役的凡人一起干活。不同的是，他们还叫他一声林师兄，因为再废也是炼气一层，比凡人强。\n\n但也仅此而已。\n\n明日，就是外门弟子的考核。林越知道，若再拿不出一点像样的修为，他就会被逐出青阳宗。"
        }
      ],
      entities: [
        { name: "林越", type: "characters", importance: "核心", lifecycle: "活跃", first: "第0章", last: "第1章", traits: "隐忍、坚韧、重情义", motive: "证明自己不是废物，保护唯一对他好的苏瑶", ability: "万界吞天诀，可吞噬能量转化修为", note: "被剑无尘打伤后，获得神秘戒指认主。" },
        { name: "老鬼", type: "characters", importance: "重要", lifecycle: "活跃", first: "第1章", last: "第1章", traits: "刻薄、见多识广", motive: "借林越恢复残魂", ability: "识别古法与秘境", note: "寄居戒指内。" },
        { name: "苏瑶", type: "characters", importance: "重要", lifecycle: "活跃", first: "第0章", last: "第1章", traits: "克制、温柔、外冷内热", motive: "查清父亲失踪真相", ability: "水系灵根", note: "曾暗中送药给林越。" },
        { name: "剑无尘", type: "characters", importance: "次要", lifecycle: "活跃", first: "第0章", last: "第1章", traits: "高傲、狠辣", motive: "阻止林越参加外门考核", ability: "青锋剑诀", note: "外门执事弟子。" },
        { name: "外门药田", type: "locations", importance: "重要", lifecycle: "活跃", first: "第1章", last: "第1章", traits: "贫瘠、偏僻、杂役聚集", motive: "主角开局受压迫地点", ability: "地下埋有吞灵阵残片", note: "第10章可回收伏笔。" },
        { name: "黑色戒指", type: "items", importance: "核心", lifecycle: "活跃", first: "第1章", last: "第1章", traits: "冰冷、残破、可吸血认主", motive: "承载老鬼残魂", ability: "开启戒中空间", note: "不能过早暴露完整来历。" },
        { name: "青阳宗外门", type: "factions", importance: "重要", lifecycle: "活跃", first: "第0章", last: "第1章", traits: "等级森严、资源倾斜", motive: "制造早期压迫与规则冲突", ability: "掌控外门考核", note: "卷2进入长老线。" },
        { name: "废灵根真相", type: "secrets", importance: "核心", lifecycle: "冷存", first: "第0章", last: "未揭示", traits: "古法遗留、吞噬体质", motive: "长期悬念", ability: "解释主角异常成长", note: "卷3前只给碎片，不完整揭示。" }
      ],
      states: [
        { title: "废灵根崛起", chapter: "第1章", location: "外门药田 → 外门木屋", event: "林越获得万界吞天诀，被器灵拉入戒指空间，即将开启吞噬灵力之路。", tags: ["林越", "苏瑶", "主线启动"] }
      ],
      current: {
        location: "外门药田 → 外门木屋",
        next: "第2章",
        progress: "0%",
        direction: "林越获得万界吞天诀，被器灵拉入戒指空间，即将开启变强之路。",
        block: "对齐第2章 · 卷1 废柴崛起。段落修为：炼气九层。关键点：突破限制、反击铺垫。"
      },
      logs: [
        "OutlineAgent：卷1 已完成 2 个剧情块。",
        "WriterAgent：第1章正文生成完成。",
        "LogicCheckAgent：通过，建议加强结尾钩子。"
      ],
      quality: [
        { name: "人物动机", status: "PASS", note: "林越的生存压力明确，反击动机成立。" },
        { name: "升级逻辑", status: "WARN", note: "吞天诀能力需要更多限制，避免成长太快。" },
        { name: "伏笔密度", status: "PASS", note: "戒指、废灵根、药田秘洞均可回收。" },
        { name: "文风稳定", status: "PASS", note: "压抑开局与修仙爽点匹配。" },
        { name: "章节钩子", status: "WARN", note: "第1章结尾可以更强，建议直接出现戒中声音。" }
      ]
    }
  ]
};

let state = loadState();
let activeView = "book";
let activeTab = "chapters";
let activeChapter = 0;
let activeEntity = 0;
let memoryFilter = "all";

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(seed);
  try {
    return migrateState({ ...structuredClone(seed), ...JSON.parse(raw) });
  } catch {
    return structuredClone(seed);
  }
}

function migrateState(data) {
  data.models ||= structuredClone(seed.models);
  data.pipeline ||= structuredClone(seed.pipeline);
  data.queue ||= structuredClone(seed.queue);
  data.rules ||= structuredClone(seed.rules);
  data.generationConfig ||= structuredClone(seed.generationConfig);
  data.memorySystem ||= structuredClone(seed.memorySystem);
  data.cloud ||= structuredClone(seed.cloud);
  data.account ||= structuredClone(seed.account);
  data.agentInjection ||= structuredClone(seed.agentInjection);
  data.projectTree ||= structuredClone(seed.projectTree);
  data.traces ||= structuredClone(seed.traces);
  data.requests ||= [];
  data.prompts ||= structuredClone(seed.prompts);
  data.agents ||= structuredClone(seed.agents);
  data.books = (data.books || []).map((book) => {
    const base = structuredClone(seed.books[0]);
    return {
      ...base,
      ...book,
      questionnaire: { ...base.questionnaire, ...(book.questionnaire || {}) },
      volumes: book.volumes?.length ? book.volumes : base.volumes,
      blocks: book.blocks?.length ? book.blocks : base.blocks,
      entities: book.entities?.length ? book.entities : base.entities,
      states: book.states || [],
      quality: book.quality?.length ? book.quality : base.quality,
      current: { ...base.current, ...(book.current || {}) },
      logs: book.logs || []
    };
  });
  if (!data.books.length) data.books = structuredClone(seed.books);
  if (!data.activeBookId || !data.books.some((book) => book.id === data.activeBookId)) {
    data.activeBookId = data.books[0].id;
  }
  if (!data.activePromptId || !data.prompts.some((prompt) => prompt.id === data.activePromptId)) {
    data.activePromptId = data.prompts[0]?.id;
  }
  data.requests = data.requests.map((request, index) => ({
    id: request.id || `req_${index}_${Date.now()}`,
    model: request.model || "deepseek-v4-flash",
    latency: request.latency || "-",
    tokens: request.tokens || 0,
    prompt: request.prompt || "未记录提示词。",
    output: request.output || request.text || "未记录输出。",
    ...request
  }));
  data.activeRequestId ||= data.requests[0]?.id || "";
  return data;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function activeBook() {
  return state.books.find((book) => book.id === state.activeBookId) || state.books[0];
}

function $(selector) {
  return document.querySelector(selector);
}

function on(selector, event, handler) {
  const element = $(selector);
  if (element) element.addEventListener(event, handler);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function openBookDialog() {
  const dialog = $("#bookDialog");
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
    dialog.classList.add("is-open-fallback");
  }
  $("#newTitle")?.focus();
}

function closeBookDialog() {
  const dialog = $("#bookDialog");
  if (!dialog) return;
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
  }
  dialog.removeAttribute("open");
  dialog.classList.remove("is-open-fallback");
}

function setView(view) {
  activeView = view;
  document.body.dataset.view = view;
  $all(".view").forEach((el) => el.classList.remove("is-active"));
  $(`#${view}View`)?.classList.add("is-active");
  $all(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  const titles = {
    home: ["主页", "以清风为伴，写长篇江湖"],
    shelf: ["书架", "小说项目"],
    site: ["云端站点", "公开访问与部署中心"],
    account: ["账号团队", "用户、权限与协作"],
    book: ["工作台", activeBook().title],
    config: ["模型管理", "模型库与 Agent 配置"],
    pipeline: ["Agent流程", "生成链路编排"],
    queue: ["批量任务", "章节生成队列"],
    prompts: ["提示词", "写作规则与风格控制"],
    rules: ["质量规则", "检查器配置"],
    requests: ["请求记录", "生成日志"],
    data: ["数据管理", "本地数据与备份"]
  };
  const title = titles[view] || titles.home;
  $("#crumb").textContent = title[0];
  $("#pageTitle").textContent = title[1];
  render();
}

function setTab(tab) {
  activeTab = tab;
  $all(".tab").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  $all(".tab-panel").forEach((panel) => panel.classList.remove("is-active"));
  $(`#${tab}Panel`)?.classList.add("is-active");
  renderBookDetail();
  renderOpsConsole();
}

function render() {
  const book = activeBook();
  $("#activeBookName").textContent = book.title;
  $("#activeBookMeta").textContent = `${book.genre} / ${book.targetChapters} 章`;
  $("#bookCount").textContent = state.books.length;
  $("#chapterCount").textContent = book.chapters.length;
  $("#characterCount").textContent = book.entities.length;
  renderShelf();
  renderSite();
  renderAccount();
  renderBookDetail();
  renderModels();
  renderConfig();
  renderToolConfig();
  renderInjection();
  renderPipeline();
  renderQueue();
  renderPrompts();
  renderRules();
  renderRequests();
  renderTraces();
  renderProjectTree();
  renderDataPreview();
}

function renderShelf() {
  const grid = $("#bookGrid");
  grid.innerHTML = "";
  state.books.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-cover">${escapeHtml(book.title.slice(0, 6))}</div>
      <h3>${escapeHtml(book.title)}</h3>
      <small>${escapeHtml(book.genre)} · ${book.trope}</small>
      <p>${escapeHtml(book.premise)}</p>
      <button class="primary">进入工作台</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      state.activeBookId = book.id;
      saveState();
      setView("book");
    });
    grid.appendChild(card);
  });
}

function renderSite() {
  if (!$("#siteView")) return;
  $("#publishStatus").textContent = state.cloud.status === "READY" ? "可发布" : "本地预览";
  $("#publishDomain").textContent = `建议域名：${state.cloud.domain}`;
  $("#accessModeList").innerHTML = state.cloud.accessModes.map((item) => `
    <div class="cloud-row">
      <strong>${escapeHtml(item.name)}</strong>
      <span class="tag ${item.status === "目标" ? "hot" : ""}">${escapeHtml(item.status)}</span>
      <small>${escapeHtml(item.note)}</small>
    </div>
  `).join("");
  $("#deployChecklist").innerHTML = state.cloud.deployChecklist.map((item, index) => `
    <button class="check-row ${item.done ? "is-done" : ""}" data-deploy-check="${index}">
      <span>${item.done ? "✓" : index + 1}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.note)}</small>
    </button>
  `).join("");
  $all("[data-deploy-check]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.cloud.deployChecklist[Number(button.dataset.deployCheck)];
      item.done = !item.done;
      state.cloud.status = state.cloud.deployChecklist.every((step) => step.done) ? "READY" : "LOCAL_PREVIEW";
      saveState();
      renderSite();
    });
  });
  $("#cloudArchitecture").innerHTML = state.cloud.architecture.map(([name, note]) => `
    <div class="arch-row"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(note)}</span></div>
  `).join("");
  $("#siteFeatureMatrix").innerHTML = state.cloud.featureMatrix.map((item) => `
    <article class="feature-card">
      <strong>${escapeHtml(item.name)}</strong>
      <dl>
        <dt>当前静态版</dt><dd>${escapeHtml(item.local)}</dd>
        <dt>真实云端版</dt><dd>${escapeHtml(item.cloud)}</dd>
      </dl>
    </article>
  `).join("");
}

function renderAccount() {
  if (!$("#accountView")) return;
  $("#profileNameInput").value = state.account.name;
  $("#profileEmailInput").value = state.account.email;
  $("#profileRoleInput").value = state.account.role;
  $("#mockLoginBtn").textContent = state.account.loggedIn ? "退出模拟登录" : "模拟登录";
  $("#quotaGrid").innerHTML = Object.entries(state.account.quota).map(([key, value]) => `
    <article>
      <span>${escapeHtml(quotaLabel(key))}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
  $("#teamList").innerHTML = state.account.team.map((member) => `
    <div class="team-row">
      <strong>${escapeHtml(member.name)}</strong>
      <span>${escapeHtml(member.email)}</span>
      <small>${escapeHtml(member.role)} · ${escapeHtml(member.status)}</small>
    </div>
  `).join("");
}

function quotaLabel(key) {
  return {
    novels: "小说项目",
    chapters: "章节额度",
    aiRuns: "AI 调用",
    storage: "存储空间"
  }[key] || key;
}

function renderBookDetail() {
  const book = activeBook();
  $("#bookTitle").textContent = book.title;
  $("#bookSub").textContent = `${book.genre} · ${book.trope} · 约 ${Math.round(totalWords(book) / 1000)} KB · ${book.chapters.length} / ${book.targetChapters} 章`;
  $("#batchTarget").value = book.targetChapters;
  $("#shortcutChapters").textContent = `${book.chapters.length} 章`;
  $("#shortcutVolumes").textContent = `${book.volumes.length} 卷`;
  $("#shortcutMemory").textContent = `${book.entities.length} 条`;
  renderChapters(book);
  renderChapterInspector(book);
  renderQuestionnaire(book);
  renderOutline(book);
  renderOutlineTools(book);
  renderVolumes(book);
  renderBlocks(book);
  renderStates(book);
  renderCurrent(book);
  renderMemory(book);
  renderMemoryDashboard(book);
  renderQuality(book);
  renderParams(book);
  renderLogs(book);
}

function renderChapterInspector(book) {
  const injections = [
    "大纲",
    "本章块内写作指引",
    "最近状态追踪",
    "活跃实体",
    "完整前文",
    "终结实体警告"
  ];
  $("#chapterInjectionList").innerHTML = `<div class="inspector-list">${injections.map((item) => `<div class="inspector-item">${escapeHtml(item)}：已注入</div>`).join("")}</div>`;
  const reviews = book.quality || [];
  $("#chapterReviewList").innerHTML = `<div class="inspector-list">${reviews.map((item) => `<div class="inspector-item"><b>${escapeHtml(item.status)}</b> ${escapeHtml(item.name)}：${escapeHtml(item.note)}</div>`).join("")}</div>`;
  $("#chapterTraceList").innerHTML = `<div class="inspector-list">${state.traces.slice(0, 4).map((trace) => `<div class="inspector-item">${escapeHtml(trace.type)}<br><small>${escapeHtml(trace.file)}</small></div>`).join("")}</div>`;
}

function renderOutlineTools(book) {
  $("#outlineSessions").innerHTML = `
    <div class="inspector-list">
      <div class="inspector-item">questionnaire_default：立项问卷会话</div>
      <div class="inspector-item">outline_draft_chat：实时大纲聊天</div>
      <div class="inspector-item">outline_draft_reasoning：推理记录</div>
    </div>
  `;
  $("#outlineArtifacts").innerHTML = `
    <div class="inspector-list">
      <div class="inspector-item">全书大纲：${escapeHtml(book.title)}</div>
      <div class="inspector-item">卷结构：${book.volumes.length} 卷</div>
      <div class="inspector-item">块纲：${book.blocks.length} 个剧情块</div>
    </div>
  `;
}

function renderOpsConsole() {
  const book = activeBook();
  $("#opsSteps").innerHTML = state.pipeline.map((step, index) => `
    <div class="ops-step">
      <span>${index + 1}</span>
      <b>${escapeHtml(step.name)}</b>
      <small>${escapeHtml(step.status)}</small>
    </div>
  `).join("");
  const writerInjection = state.agentInjection.writer || {};
  $("#contextPack").innerHTML = Object.entries(writerInjection).map(([name, enabled]) => `
    <span class="context-chip ${enabled ? "on" : ""}">${escapeHtml(name)}</span>
  `).join("");
  $("#chapterTaskCard").innerHTML = `
    <dt>目标章节</dt><dd>${escapeHtml(book.current.next)}</dd>
    <dt>目标字数</dt><dd>${book.wordsPerChapter} 字</dd>
    <dt>剧情块</dt><dd>${escapeHtml(book.blocks?.[0]?.title || "未设置")}</dd>
    <dt>约束</dt><dd>承接最近状态，禁止越出块边界</dd>
    <dt>质检</dt><dd>${book.quality?.filter((item) => item.status === "WARN").length || 0} 个警告</dd>
  `;
  const metrics = [
    ["章节", Math.min(100, Math.round((book.chapters.length / Math.max(book.targetChapters, 1)) * 100))],
    ["记忆", Math.min(100, book.entities.length * 10)],
    ["伏笔", 62],
    ["Trace", Math.min(100, state.traces.length * 18)]
  ];
  $("#runtimeMonitor").innerHTML = metrics.map(([name, value]) => `
    <div class="runtime-row">
      <span>${escapeHtml(name)}</span>
      <div class="runtime-bar"><span style="width:${value}%"></span></div>
      <b>${value}%</b>
    </div>
  `).join("");
}

function renderQuestionnaire(book) {
  const box = $("#questionnaireForm");
  box.innerHTML = "";
  Object.entries(book.questionnaire || {}).forEach(([key, value]) => {
    const card = document.createElement("article");
    card.className = "question-card";
    card.innerHTML = `<label><strong>${escapeHtml(key)}</strong><textarea>${escapeHtml(value)}</textarea></label>`;
    card.querySelector("textarea").addEventListener("change", (event) => {
      book.questionnaire[key] = event.target.value;
      saveState();
    });
    box.appendChild(card);
  });
}

function renderChapters(book) {
  const list = $("#chapterList");
  list.innerHTML = "";
  book.chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.className = `chapter-item ${index === activeChapter ? "is-active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(chapter.title)}</strong><small>${chapter.body.length} 字</small>`;
    button.addEventListener("click", () => {
      saveCurrentChapter();
      activeChapter = index;
      renderChapters(book);
    });
    list.appendChild(button);
  });
  const chapter = book.chapters[activeChapter] || book.chapters[0];
  if (chapter) {
    $("#chapterTitleInput").value = chapter.title;
    $("#chapterBodyInput").value = chapter.body;
  }
}

function saveCurrentChapter() {
  const book = activeBook();
  const chapter = book.chapters[activeChapter];
  if (!chapter) return;
  chapter.title = $("#chapterTitleInput").value.trim() || chapter.title;
  chapter.body = $("#chapterBodyInput").value;
  saveState();
}

function renderOutline(book) {
  $("#outlineInput").value = book.outline;
}

function renderVolumes(book) {
  $("#volumeList").innerHTML = book.volumes.map((item, index) => `
    <article class="volume-card">
      <header class="card-title-row">
        <h3>${escapeHtml(item.name)}</h3>
        <button class="ghost small-btn" data-delete-volume="${index}">删除</button>
      </header>
      <small>${escapeHtml(item.range)}</small>
      <p>${escapeHtml(item.hook)}</p>
    </article>
  `).join("");
  $all("[data-delete-volume]").forEach((button) => {
    button.addEventListener("click", () => {
      const book = activeBook();
      if (book.volumes.length <= 1) return;
      book.volumes.splice(Number(button.dataset.deleteVolume), 1);
      saveState();
      renderBookDetail();
    });
  });
}

function renderBlocks(book) {
  $("#blockBoard").innerHTML = (book.blocks || []).map((item) => `
    <article class="block-card">
      <header>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="tag ${item.status === "运行中" ? "hot" : ""}">${escapeHtml(item.status)}</span>
      </header>
      <small>${escapeHtml(item.volume)} · ${escapeHtml(item.range)}</small>
      <p>${escapeHtml(item.goal)}</p>
    </article>
  `).join("");
}

function renderStates(book) {
  $("#stateTimeline").innerHTML = book.states.map((item, index) => `
    <article class="timeline-item">
      <strong>${index + 1}. ${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.event)}</p>
      <small>${escapeHtml(item.chapter)} · ${escapeHtml(item.location)}</small>
      <div>${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderCurrent(book) {
  $("#currentState").innerHTML = `
    <dt>当前地点</dt><dd>${escapeHtml(book.current.location)}</dd>
    <dt>下一章</dt><dd>${escapeHtml(book.current.next)}</dd>
    <dt>全书进度</dt><dd>${escapeHtml(book.current.progress)}</dd>
    <dt>故事走向</dt><dd>${escapeHtml(book.current.direction)}</dd>
  `;
  $("#currentBlock").innerHTML = `
    <dt>所属卷</dt><dd>${escapeHtml(book.volumes[0]?.name || "未设置")}</dd>
    <dt>对应章节</dt><dd>${escapeHtml(book.current.next)}</dd>
    <dt>剧情块</dt><dd>${escapeHtml(book.current.block)}</dd>
  `;
}

function renderMemory(book) {
  const filters = [
    ["all", "全部"],
    ["characters", "角色"],
    ["locations", "地点"],
    ["items", "物品"],
    ["factions", "阵营"],
    ["secrets", "秘闻"]
  ];
  $("#memoryFilters").innerHTML = filters.map(([key, label]) => `
    <button class="memory-filter ${memoryFilter === key ? "is-active" : ""}" data-memory="${key}">${label} ${key === "all" ? book.entities.length : book.entities.filter((item) => item.type === key).length}</button>
  `).join("");
  $all(".memory-filter").forEach((button) => {
    button.addEventListener("click", () => {
      memoryFilter = button.dataset.memory;
      activeEntity = 0;
      renderMemory(book);
    });
  });
  const entities = memoryFilter === "all" ? book.entities : book.entities.filter((entity) => entity.type === memoryFilter);
  const list = $("#entityList");
  list.innerHTML = "";
  entities.forEach((entity, index) => {
    const button = document.createElement("button");
    button.className = `entity-item ${index === activeEntity ? "is-active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(entity.name)}</strong><small>${entity.importance} · ${entity.lifecycle}</small>`;
    button.addEventListener("click", () => {
      activeEntity = index;
      renderMemory(book);
    });
    list.appendChild(button);
  });
  const entity = entities[activeEntity] || entities[0];
  $("#entityDetail").innerHTML = entity ? `
    <h3>${escapeHtml(entity.name)} <span class="tag">${escapeHtml(entity.importance)}</span><span class="tag">${escapeHtml(entity.lifecycle)}</span></h3>
    <table>
      <tr><td>实体类型</td><td>${escapeHtml(entity.type)}</td></tr>
      <tr><td>首次登场</td><td>${escapeHtml(entity.first)}</td></tr>
      <tr><td>最近出现</td><td>${escapeHtml(entity.last)}</td></tr>
      <tr><td>性格</td><td>${escapeHtml(entity.traits)}</td></tr>
      <tr><td>动机</td><td>${escapeHtml(entity.motive)}</td></tr>
      <tr><td>核心能力</td><td>${escapeHtml(entity.ability)}</td></tr>
      <tr><td>状态备注</td><td>${escapeHtml(entity.note)}</td></tr>
    </table>
  ` : "";
}

function renderMemoryDashboard(book) {
  const counts = {
    角色: book.entities.filter((item) => item.type === "characters").length,
    地点: book.entities.filter((item) => item.type === "locations").length,
    物品: book.entities.filter((item) => item.type === "items").length,
    阵营: book.entities.filter((item) => item.type === "factions").length,
    秘闻: book.entities.filter((item) => item.type === "secrets").length
  };
  $("#memoryDashboard").innerHTML = Object.entries(counts).map(([name, count]) => `
    <article>
      <span>${escapeHtml(name)}</span>
      <strong>${count}</strong>
      <small>生命周期追踪</small>
    </article>
  `).join("");
}

function renderQuality(book) {
  $("#qualityGrid").innerHTML = (book.quality || []).map((item) => `
    <article class="quality-card">
      <header>
        <strong>${escapeHtml(item.name)}</strong>
        <span class="tag ${item.status === "WARN" ? "warn" : ""}">${escapeHtml(item.status)}</span>
      </header>
      <p>${escapeHtml(item.note)}</p>
    </article>
  `).join("");
}

function renderParams(book) {
  $("#targetChaptersInput").value = book.targetChapters;
  $("#wordsInput").value = book.wordsPerChapter;
  $("#styleRange").value = book.stylePower;
  $("#logicRange").value = book.logicPower;
}

function renderLogs(book) {
  $("#logList").innerHTML = book.logs.map((log) => `<article class="request-item">${escapeHtml(log)}</article>`).join("");
}

function renderConfig() {
  $("#agentConfig").innerHTML = state.agents.map(([label, model, agent]) => `
    <article class="config-card">
      <strong>${escapeHtml(label)}</strong>
      <select>
        <option selected>${escapeHtml(model)}</option>
        <option>deepseek-chat</option>
        <option>gpt-4.1-mini</option>
        <option>claude-sonnet</option>
      </select>
      <small>${escapeHtml(agent)}</small>
    </article>
  `).join("");
}

function renderToolConfig() {
  const generationLabels = {
    max_retries: "最大重试",
    word_min: "最低字数",
    word_target: "目标字数",
    word_max: "最高字数",
    writing_style: "写作风格",
    logic_check_strict: "严格质检",
    plan_chapter_count: "规划章数"
  };
  $("#generationSettings").innerHTML = Object.entries(state.generationConfig).map(([key, value]) => `
    <div class="setting-row"><strong>${generationLabels[key] || key}</strong><span>${escapeHtml(value)}</span></div>
  `).join("");

  const memoryLabels = {
    snapshot_interval: "快照间隔",
    archive_interval: "归档间隔",
    entity_inactive_window: "实体不活跃窗口",
    cooling_window: "冷却窗口",
    cold_window: "冷存窗口",
    recent_full_chapters: "完整前文章数",
    recent_summary_chapters: "摘要前文章数",
    recent_key_info_chapters: "关键信息章数",
    max_active_foreshadows: "最大活跃伏笔"
  };
  $("#memorySettings").innerHTML = Object.entries(state.memorySystem).map(([key, value]) => `
    <div class="setting-row"><strong>${memoryLabels[key] || key}</strong><span>${escapeHtml(value)}</span></div>
  `).join("");
}

function renderInjection() {
  $("#injectionMatrix").innerHTML = Object.entries(state.agentInjection).map(([agent, fields]) => `
    <article class="injection-card">
      <header>
        <strong>${escapeHtml(agent)}</strong>
        <span class="tag">${Object.values(fields).filter(Boolean).length}/${Object.keys(fields).length}</span>
      </header>
      <div class="injection-list">
        ${Object.entries(fields).map(([name, enabled]) => `<button class="memory-filter ${enabled ? "is-active" : ""}" data-injection-agent="${escapeHtml(agent)}" data-injection-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")}
      </div>
    </article>
  `).join("");
  $all("[data-injection-agent]").forEach((button) => {
    button.addEventListener("click", () => {
      const agent = button.dataset.injectionAgent;
      const name = button.dataset.injectionName;
      state.agentInjection[agent][name] = !state.agentInjection[agent][name];
      saveState();
      renderInjection();
    });
  });
}

function renderModels() {
  $("#modelLibrary").innerHTML = state.models.map((model) => `
    <article class="model-card">
      <header>
        <strong>${escapeHtml(model.name)}</strong>
        <span class="tag ${model.status === "可用" ? "hot" : ""}">${escapeHtml(model.status)}</span>
      </header>
      <small>${escapeHtml(model.provider)}</small>
      <p>${escapeHtml(model.role)}</p>
      <button class="ghost" data-model="${escapeHtml(model.name)}">测试连接</button>
    </article>
  `).join("");
  $all("[data-model]").forEach((button) => {
    button.addEventListener("click", () => {
      addRequest("ModelTester", "PASS", `模型 ${button.dataset.model} 静态连接测试通过。`, "测试模型配置", "静态版未实际请求 API。");
      saveState();
      render();
    });
  });
}

function renderPipeline() {
  $("#pipelineBoard").innerHTML = state.pipeline.map((step, index) => `
    <article class="pipeline-card">
      <span class="tag">${index + 1}</span>
      <h3>${escapeHtml(step.name)}</h3>
      <small>${escapeHtml(step.agent)}</small>
      <p>${escapeHtml(step.input)} → ${escapeHtml(step.output)}</p>
      <span class="tag ${step.status === "DONE" ? "hot" : ""}">${escapeHtml(step.status)}</span>
    </article>
  `).join("");
  $("#pipelineDetail").innerHTML = `
    <h3>执行链说明</h3>
    <p>立项问卷进入脑洞共创，再生成全书大纲、卷纲、剧情块；正文 Agent 写章节后交给逻辑检查，最后由状态更新 Agent 写入记忆库。</p>
  `;
}

function renderQueue() {
  $("#queueList").innerHTML = state.queue.map((job) => `
    <article class="queue-item">
      <strong>${escapeHtml(job.type)}</strong>
      <div>
        <small>${escapeHtml(job.range)} · 重试 ${job.retry}</small>
        <div class="progress"><span style="width:${Number(job.progress) || 0}%"></span></div>
      </div>
      <span class="tag ${job.status === "DONE" ? "hot" : ""}">${escapeHtml(job.status)}</span>
      <button class="ghost" data-run-job="${escapeHtml(job.id)}">${job.status === "DONE" ? "重跑" : "模拟运行"}</button>
    </article>
  `).join("");
  $all("[data-run-job]").forEach((button) => {
    button.addEventListener("click", () => {
      const job = state.queue.find((item) => item.id === button.dataset.runJob);
      if (!job) return;
      job.status = "DONE";
      job.progress = 100;
      addRequest("BatchRunner", "PASS", `${job.range} ${job.type} 已模拟完成。`, "执行批量队列", "队列状态已更新。");
      saveState();
      render();
    });
  });
}

function renderRules() {
  $("#ruleList").innerHTML = state.rules.map((rule) => `
    <article class="rule-item">
      <strong>${escapeHtml(rule.name)}</strong>
      <span>${escapeHtml(rule.text)}</span>
      <span class="tag ${rule.level === "高" ? "warn" : ""}">${escapeHtml(rule.level)}</span>
      <button class="ghost" data-rule="${escapeHtml(rule.id)}">${rule.enabled ? "停用" : "启用"}</button>
    </article>
  `).join("");
  $all("[data-rule]").forEach((button) => {
    button.addEventListener("click", () => {
      const rule = state.rules.find((item) => item.id === button.dataset.rule);
      if (!rule) return;
      rule.enabled = !rule.enabled;
      saveState();
      renderRules();
    });
  });
}

function renderPrompts() {
  const list = $("#promptList");
  list.innerHTML = "";
  state.prompts.forEach((prompt) => {
    const button = document.createElement("button");
    button.className = `prompt-item ${prompt.id === state.activePromptId ? "is-active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(prompt.name)}</strong><small>${prompt.enabled ? "已启用" : "未启用"}</small>`;
    button.addEventListener("click", () => {
      savePrompt();
      state.activePromptId = prompt.id;
      saveState();
      renderPrompts();
    });
    list.appendChild(button);
  });
  const prompt = activePrompt();
  $("#promptNameInput").value = prompt?.name || "";
  $("#promptBodyInput").value = prompt?.body || "";
  $("#enablePromptBtn").textContent = prompt?.enabled ? "停用" : "启用";
}

function activePrompt() {
  return state.prompts.find((prompt) => prompt.id === state.activePromptId) || state.prompts[0];
}

function savePrompt() {
  const prompt = activePrompt();
  if (!prompt) return;
  prompt.name = $("#promptNameInput").value.trim() || prompt.name;
  prompt.body = $("#promptBodyInput").value;
  saveState();
}

function renderRequests() {
  $("#requestStats").innerHTML = `
    <article><span>总请求</span><strong>${state.requests.length}</strong></article>
    <article><span>通过</span><strong>${state.requests.filter((item) => item.status === "PASS").length}</strong></article>
    <article><span>等待</span><strong>${state.requests.filter((item) => item.status === "WAITING").length}</strong></article>
  `;
  $("#requestList").innerHTML = state.requests.map((item) => `
    <article class="request-item ${item.id === state.activeRequestId ? "is-active" : ""}" data-request="${escapeHtml(item.id)}">
      <header><strong>${escapeHtml(item.agent)}</strong><span class="tag">${escapeHtml(item.status)}</span></header>
      <p>${escapeHtml(item.text)}</p>
      <small>${escapeHtml(item.time)}</small>
    </article>
  `).join("");
  $all("[data-request]").forEach((item) => {
    item.addEventListener("click", () => {
      state.activeRequestId = item.dataset.request;
      saveState();
      renderRequests();
    });
  });
  const request = state.requests.find((item) => item.id === state.activeRequestId) || state.requests[0];
  $("#requestDetail").innerHTML = request ? `
    <h3>${escapeHtml(request.agent)} 请求详情</h3>
    <dl>
      <dt>状态</dt><dd>${escapeHtml(request.status)}</dd>
      <dt>模型</dt><dd>${escapeHtml(request.model)}</dd>
      <dt>耗时</dt><dd>${escapeHtml(request.latency)}</dd>
      <dt>Tokens</dt><dd>${escapeHtml(request.tokens)}</dd>
    </dl>
    <h4>Prompt</h4>
    <pre>${escapeHtml(request.prompt)}</pre>
    <h4>Output</h4>
    <pre>${escapeHtml(request.output)}</pre>
  ` : "<p>暂无请求。</p>";
}

function renderTraces() {
  $("#traceGrid").innerHTML = state.traces.map((trace) => `
    <article class="trace-card">
      <header>
        <strong>${escapeHtml(trace.type)}</strong>
        <span class="tag">${escapeHtml(trace.agent)}</span>
      </header>
      <small>${escapeHtml(trace.file)}</small>
      <pre>${escapeHtml(trace.summary)}</pre>
    </article>
  `).join("");
}

function renderProjectTree() {
  $("#projectTree").innerHTML = state.projectTree.map((node) => `
    <article class="project-node">
      <header>
        <strong>${escapeHtml(node.name)}</strong>
        <span class="tag">${node.files.length}</span>
      </header>
      <div class="injection-list">
        ${node.files.map((file) => `<span class="tag">${escapeHtml(file)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderDataPreview() {
  const target = $("#dataPreview");
  if (target) target.value = JSON.stringify(state, null, 2);
}

function addRequest(agent, status, text, prompt = "未记录提示词。", output = "未记录输出。") {
  const request = {
    id: `req_${Date.now()}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    agent,
    status,
    model: "deepseek-v4-flash",
    latency: `${(Math.random() * 2 + 0.8).toFixed(1)}s`,
    tokens: Math.floor(Math.random() * 3000 + 1200),
    text,
    prompt,
    output
  };
  state.requests.unshift(request);
  state.activeRequestId = request.id;
}

function createBook() {
  const title = $("#newTitle").value.trim();
  if (!title) return;
  const genre = $("#newGenre").value.trim() || "未分类";
  const premise = $("#newPremise").value.trim() || "尚未填写主线。";
  const id = `book_${Date.now()}`;
  state.books.push({
    id,
    title,
    genre,
    trope: "待设定",
    targetChapters: 120,
    wordsPerChapter: 3000,
    stylePower: 6,
    logicPower: 7,
    premise,
    questionnaire: {
      "故事卖点": premise,
      "主角目标": "待填写",
      "核心爽点": "待填写",
      "情绪底色": "待填写",
      "禁写内容": "待填写",
      "读者期待": "待填写"
    },
    outline: "卷1：请在这里写主线大纲。\n卷2：请在这里写升级路线。",
    volumes: [{ name: "卷1 · 开局", range: "第1-30章", hook: premise }],
    blocks: [{ volume: "卷1", range: "第1-5章", title: "开局剧情块", status: "待处理", goal: premise }],
    chapters: [{ title: "第1章 · 开局", body: "在这里开始你的第一章。" }],
    entities: [],
    states: [],
    current: { location: "待设定", next: "第1章", progress: "0%", direction: premise, block: "待生成剧情块。" },
    logs: ["系统：新小说已创建。"],
    quality: [{ name: "基础检查", status: "WAIT", note: "生成章节后开始检查。" }]
  });
  state.activeBookId = id;
  activeChapter = 0;
  activeEntity = 0;
  saveState();
  closeBookDialog();
  setView("book");
}

async function generateChapter() {
  saveCurrentChapter();
  const book = activeBook();
  const number = book.chapters.length + 1;
  const cloudResult = await requestCloudChapter(book, number);
  const fallback = {
    title: `第${number}章 · 戒中残魂`,
    body: `夜色压下来的时候，木屋里只剩一盏快要燃尽的油灯。\n\n林越攥着那枚黑色戒指，掌心的血还未干透。下一瞬，冰冷的声音在他识海里响起。\n\n“废灵根？那只是他们看不懂你的命。”\n\n他猛地睁眼，眼前已不是破旧木屋，而是一片悬浮在黑暗中的石台。石台中央，残魂老人负手而立，像等了他很久。\n\n“想活下去，就吞掉第一缕灵气。”`,
    quality: [
      { name: "人物动机", status: "PASS", note: "主角行动由生存压力触发。" },
      { name: "升级逻辑", status: "PASS", note: "新能力只给入口，未直接无敌。" },
      { name: "章节钩子", status: "PASS", note: "戒中残魂抛出下一章问题。" },
      { name: "信息密度", status: "WARN", note: "可以加入一个更具体的外门考核倒计时。" }
    ],
    state: {
      title: "戒中残魂苏醒",
      chapter: `第${number}章 · 戒中残魂`,
      location: "外门木屋",
      event: "林越进入戒指空间，与老鬼第一次对话，确认废灵根另有隐情。",
      tags: ["林越", "老鬼", "功法"]
    }
  };
  const generated = cloudResult || fallback;
  const title = generated.title || fallback.title;
  const body = generated.body || fallback.body;
  book.chapters.push({ title, body });
  book.logs.unshift(`WriterAgent：${title} ${cloudResult ? "云端生成" : "模拟生成"}完成。`);
  book.states.push({
    title: generated.state?.title || "戒中残魂苏醒",
    chapter: title,
    location: generated.state?.location || "外门木屋",
    event: generated.state?.event || "林越进入戒指空间，与老鬼第一次对话，确认废灵根另有隐情。",
    tags: generated.state?.tags || ["林越", "老鬼", "功法"]
  });
  book.blocks[0].status = "已生成";
  book.quality = generated.quality?.length ? generated.quality : fallback.quality;
  book.current.next = `第${number + 1}章`;
  book.current.progress = `${Math.round((book.chapters.length / book.targetChapters) * 100)}%`;
  addRequest("WriterAgent", "PASS", `${title} 已生成，已同步状态追踪。`, `根据 ${book.current.block} 生成 ${title}`, body);
  if (cloudResult?.trace) {
    state.traces.unshift({
      id: `trace_${Date.now()}`,
      type: "cloud_generate_response",
      agent: "WriterAgent",
      file: "Vercel/api/generate",
      summary: `模型：${cloudResult.trace.model}；输入 tokens：${cloudResult.trace.promptTokens}；输出 tokens：${cloudResult.trace.completionTokens}`
    });
  }
  activeChapter = book.chapters.length - 1;
  saveState();
  render();
  setTab("chapters");
}

async function requestCloudChapter(book, number) {
  if (location.protocol === "file:") return null;
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novel: book, chapterNo: number })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function totalWords(book) {
  return book.chapters.reduce((sum, chapter) => sum + chapter.body.length, 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (!viewButton) return;
  event.preventDefault();
  setView(viewButton.dataset.view);
});

$all(".tab").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
$all("[data-jump-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.jumpTab)));

on("#newBookBtn", "click", openBookDialog);
on("#homeNewBookBtn", "click", openBookDialog);
on("#shelfNewBookBtn", "click", openBookDialog);
on("#closeBookDialogBtn", "click", closeBookDialog);
on("#cancelBookDialogBtn", "click", closeBookDialog);
on("#bookDialog", "click", (event) => {
  if (event.target === $("#bookDialog")) closeBookDialog();
});
on("#createBookBtn", "click", (event) => {
  event.preventDefault();
  createBook();
});

on("#simulatePublishBtn", "click", () => {
  state.cloud.deployChecklist = state.cloud.deployChecklist.map((item, index) => ({ ...item, done: index <= 1 || item.done }));
  state.cloud.status = state.cloud.deployChecklist.every((step) => step.done) ? "READY" : "LOCAL_PREVIEW";
  addRequest("DeployCenter", "WAITING", "已完成前端发布检查；数据库、服务端密钥和权限策略仍需接入。", "检查云端部署清单", "GitHub 与 Vercel 阶段可继续推进。");
  saveState();
  render();
});

on("#copyDeployBtn", "click", async () => {
  const checklist = state.cloud.deployChecklist.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.name} - ${item.note}`).join("\n");
  await navigator.clipboard.writeText(`果冻写作台部署清单\n域名：${state.cloud.domain}\n\n${checklist}`);
  addRequest("DeployCenter", "SAVED", "部署清单已复制到剪贴板。", "复制部署清单", checklist);
  saveState();
  renderRequests();
});

on("#saveProfileBtn", "click", () => {
  state.account.name = $("#profileNameInput").value.trim() || state.account.name;
  state.account.email = $("#profileEmailInput").value.trim() || state.account.email;
  state.account.role = $("#profileRoleInput").value;
  const owner = state.account.team.find((member) => member.status === "OWNER");
  if (owner) {
    owner.name = state.account.name;
    owner.email = state.account.email;
    owner.role = state.account.role;
  }
  addRequest("Account", "SAVED", "账号资料已保存到本地预览数据。", "保存用户资料", JSON.stringify(state.account, null, 2));
  saveState();
  render();
});

on("#mockLoginBtn", "click", () => {
  state.account.loggedIn = !state.account.loggedIn;
  addRequest("Auth", state.account.loggedIn ? "PASS" : "SAVED", state.account.loggedIn ? "模拟登录成功。" : "已退出模拟登录。", "模拟 Supabase Auth", "静态版未连接真实账号服务。");
  saveState();
  render();
});

on("#inviteBtn", "click", () => {
  const email = $("#inviteEmailInput").value.trim();
  if (!email) return;
  state.account.team.push({
    name: email.split("@")[0],
    email,
    role: "协作者",
    status: "INVITED"
  });
  $("#inviteEmailInput").value = "";
  addRequest("Team", "SAVED", `已模拟邀请 ${email}。`, "发送团队邀请", "真实网站版需要由服务端发送邮件。");
  saveState();
  render();
});

on("#generateBtn", "click", generateChapter);
on("#bookGenerateBtn", "click", generateChapter);
on("#addModelBtn", "click", () => {
  state.models.push({ name: `custom-model-${state.models.length + 1}`, provider: "自定义", role: "待配置用途", status: "未配置" });
  saveState();
  renderModels();
});
on("#runPipelineBtn", "click", () => {
  state.pipeline.forEach((step) => {
    step.status = "DONE";
  });
  addRequest("PipelineRunner", "PASS", "Agent 流程已模拟执行完成。", "依次执行 Agent 流程", "全部节点 DONE。");
  saveState();
  render();
});
on("#createQueueBtn", "click", () => {
  const start = Number($("#queueStart").value) || 1;
  const end = Number($("#queueEnd").value) || start;
  state.queue.unshift({
    id: `job_${Date.now()}`,
    range: `第${start}-${end}章`,
    type: "批量生成",
    status: "WAITING",
    progress: 0,
    retry: Number($("#queueRetry").value) || 0
  });
  saveState();
  renderQueue();
});
on("#saveChapterBtn", "click", () => {
  saveCurrentChapter();
  render();
});
on("#addChapterBtn", "click", () => {
  saveCurrentChapter();
  const book = activeBook();
  book.chapters.push({ title: `第${book.chapters.length + 1}章 · 未命名`, body: "" });
  activeChapter = book.chapters.length - 1;
  saveState();
  render();
});
on("#deleteChapterBtn", "click", () => {
  const book = activeBook();
  if (book.chapters.length <= 1) return;
  book.chapters.splice(activeChapter, 1);
  activeChapter = Math.max(0, activeChapter - 1);
  saveState();
  render();
});
on("#batchBtn", "click", () => {
  const book = activeBook();
  book.logs.unshift(`BatchRunner：已创建批量任务，到第 ${$("#batchTarget").value} 章。`);
  addRequest("BatchRunner", "WAITING", "静态版仅记录任务，不实际调用模型。", "创建批量任务", `目标到第 ${$("#batchTarget").value} 章。`);
  saveState();
  render();
});

on("#addVolumeBtn", "click", () => {
  const book = activeBook();
  book.volumes.push({ name: `卷${book.volumes.length + 1} · 未命名`, range: "待设置", hook: "待填写卷核心冲突。" });
  saveState();
  renderVolumes(book);
});

on("#addBlockBtn", "click", () => {
  const book = activeBook();
  book.blocks.push({ volume: `卷${book.volumes.length}`, range: "待设置", title: "新剧情块", status: "待处理", goal: "待填写剧情目标。" });
  saveState();
  renderBlocks(book);
});

on("#sortBlocksBtn", "click", () => {
  const book = activeBook();
  book.blocks.sort((a, b) => a.range.localeCompare(b.range, "zh-CN"));
  saveState();
  renderBlocks(book);
});

on("#chapterTitleInput", "change", saveCurrentChapter);
on("#chapterBodyInput", "change", saveCurrentChapter);
on("#outlineInput", "change", () => {
  activeBook().outline = $("#outlineInput").value;
  saveState();
});

["targetChaptersInput", "wordsInput", "styleRange", "logicRange"].forEach((id) => {
  on(`#${id}`, "change", () => {
    const book = activeBook();
    book.targetChapters = Number($("#targetChaptersInput").value) || book.targetChapters;
    book.wordsPerChapter = Number($("#wordsInput").value) || book.wordsPerChapter;
    book.stylePower = Number($("#styleRange").value) || book.stylePower;
    book.logicPower = Number($("#logicRange").value) || book.logicPower;
    saveState();
    render();
  });
});

on("#saveConfigBtn", "click", () => {
  addRequest("Config", "SAVED", "AI配置已保存到本地浏览器。", "保存模型与 Agent 配置", "配置写入 localStorage。");
  saveState();
  renderRequests();
});

on("#toggleInjectionBtn", "click", () => {
  Object.values(state.agentInjection).forEach((fields) => {
    Object.keys(fields).forEach((key) => {
      fields[key] = !fields[key];
    });
  });
  saveState();
  renderInjection();
});

on("#addPromptBtn", "click", () => {
  const prompt = { id: `prompt_${Date.now()}`, name: "新提示词.md", enabled: false, body: "在这里写提示词。" };
  state.prompts.push(prompt);
  state.activePromptId = prompt.id;
  saveState();
  renderPrompts();
});

on("#savePromptBtn", "click", () => {
  savePrompt();
  renderPrompts();
});

on("#enablePromptBtn", "click", () => {
  const prompt = activePrompt();
  prompt.enabled = !prompt.enabled;
  saveState();
  renderPrompts();
});

on("#clearLogsBtn", "click", () => {
  state.requests = [];
  state.activeRequestId = "";
  saveState();
  renderRequests();
});

on("#addTraceBtn", "click", () => {
  const id = `trace_${Date.now()}`;
  state.traces.unshift({
    id,
    type: "writer_request",
    agent: "WriterAgent",
    file: `Trace/blobs/${id}_writer_request.json`,
    summary: "模拟追加：记录一次正文生成请求，包含上下文注入字段和章节卡。"
  });
  addRequest("Trace", "SAVED", "已追加一条 Trace blob。", "保存 Trace", id);
  saveState();
  render();
});

on("#addRuleBtn", "click", () => {
  state.rules.push({ id: `rule_${Date.now()}`, name: "新质量规则", level: "中", enabled: true, text: "填写检查标准。" });
  saveState();
  renderRules();
});

on("#downloadDataBtn", "click", () => $("#exportBtn").click());
on("#copyDataBtn", "click", async () => {
  renderDataPreview();
  await navigator.clipboard.writeText($("#dataPreview").value);
});
on("#resetDemoBtn", "click", () => {
  localStorage.removeItem(storageKey);
  state = structuredClone(seed);
  saveState();
  render();
});

on("#exportBtn", "click", () => {
  saveCurrentChapter();
  savePrompt();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "novel-workbench-export.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.body.dataset.view = activeView;
render();
