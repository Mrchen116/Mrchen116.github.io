# 写作规范：HTML 深度文章 + Markdown 短笔记

本站两种写作形态、统一的视觉系统，以及怎么把"独立 standalone HTML 文章"接入网站。

---

## 1 · 两种写作形态

| 形态 | 放在 | URL | 渲染 | 用什么场景 |
|---|---|---|---|---|
| **Note** · Markdown 短笔记 | `_posts/YYYY-MM-DD-slug.md` | `/writing/<slug>/` | Jekyll Kramdown + `_layouts/post.html` 包站点 chrome | 短随笔、突发想法、不需要花哨排版的内容 |
| **Article** · HTML 深度文章 | `_articles/<slug>.html` | `/writing/<slug>/` | `_layouts/article.html` 包站点 chrome（顶部 nav、标题、meta、底部 footer），文章 body 用共享的 `assets/css/article.css` 渲染 | 需要表格、SVG 流程图、callout、复杂代码块的长文 |

两者共享 `/writing/` URL 空间，主页和 Writing 索引页按时间合并展示，文章带 `[article]` 徽章。

---

## 2 · HTML 文章的工作流

```
[本地] my-article.html  ──→  python tools/convert.py  ──→  [仓库] _articles/my-article.html
完整 standalone HTML        结构转换 + CSS 作用域包裹             Jekyll 片段
独立双击能看                                                      站点 layout 包外壳
```

**两个文件都建议保留：**
- `drafts/my-article.html`（你的源稿，独立双击能看，方便本地预览写作）
- `_articles/my-article.html`（转换后，仓库里的版本，给 Jekyll 用）

写新文章直接复制下面的"标准模板"开干，写完跑一次 `convert.py`，就接入了。

---

## 3 · 标准写作模板（可复制开干）

新建 `drafts/my-new-article.html`，把下面整段复制进去：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>这里写文章标题</title>
  <style>
    /* === Chen, Zijian — Article template ===
       站点会用 assets/css/article.css 覆盖大部分样式，
       这里的 <style> 主要是为了让你本地双击预览也能看着舒服。
       Jekyll 渲染时 convert.py 会把这些规则用 .art-body 作用域包起来，
       所以你可以放心写 body { ... } / h1 { ... } 这种全局选择器。 */

    :root {
      --a-ink:       #1a1a1a;
      --a-muted:     #6b6b6b;
      --a-faint:     #9a9a9a;
      --a-rule:      #e6e3dc;
      --a-paper:     #ffffff;
      --a-soft:      #f5f1ea;
      --a-accent:    #8b3a2f;   /* rust — 主强调色 */
      --a-accent-soft: #f5ebe6;

      /* 语义色板 —— 见 §5 配色规范 */
      --a-plum:    #7a3a5c; --a-plum-soft:   #f1e6ec; --a-plum-stroke:   #b88aa0;
      --a-forest:  #4a6f3a; --a-forest-soft: #ecf0e6; --a-forest-stroke: #a8c0a0;
      --a-ochre:   #a07020; --a-ochre-soft:  #f5ecdb; --a-ochre-stroke:  #d4a86a;
      --a-teal:    #2a6470; --a-teal-soft:   #e6eef0; --a-teal-stroke:   #9ab8be;

      --a-code-bg:    #f5f1ea;
      --a-code-ink:   #5a2a22;
      --a-pre-bg:     #1a1a1a;
      --a-pre-ink:    #e4e0d4;
    }

    body {
      max-width: 760px; margin: 0 auto; padding: 48px 24px 80px;
      background: var(--a-paper); color: var(--a-ink);
      font-family: "Newsreader", Georgia, "Songti SC", "Noto Serif SC", serif;
      font-size: 17px; line-height: 1.72;
    }
    .eyebrow { font-family: "JetBrains Mono", monospace; font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--a-accent);
      font-weight: 500; }
    h1 { font-size: 34px; line-height: 1.15; font-weight: 500; margin: 12px 0 16px; }
    h2 { font-size: 26px; margin: 52px 0 14px; font-weight: 500; }
    h3 { font-size: 18px; margin: 32px 0 10px; font-weight: 600; }
    .lead { font-size: 19px; color: var(--a-muted); font-style: italic; margin: 0 0 24px; }
    code { font-family: "JetBrains Mono", monospace; background: var(--a-code-bg);
      color: var(--a-code-ink); padding: 1px 6px; border-radius: 3px; font-size: 0.88em; }
    pre { background: var(--a-pre-bg); color: var(--a-pre-ink); padding: 16px 20px;
      border-radius: 4px; overflow: auto; font-size: 13px; line-height: 1.6;
      font-family: "JetBrains Mono", monospace; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0;
      border: 1px solid var(--a-rule); border-radius: 4px; font-size: 14.5px;
      font-family: -apple-system, "Helvetica Neue", "PingFang SC", sans-serif; }
    th { background: var(--a-ink); color: #fff; text-align: left; padding: 10px 14px;
      font-family: "JetBrains Mono", monospace; font-size: 11.5px;
      text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
    td { padding: 11px 14px; border-bottom: 1px solid var(--a-rule); vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    blockquote { border-left: 3px solid var(--a-accent); padding-left: 18px;
      color: var(--a-muted); font-style: italic; margin: 22px 0; }
    .note { border-left: 4px solid var(--a-teal); background: var(--a-teal-soft);
      padding: 14px 18px; margin: 18px 0; border-radius: 0 4px 4px 0; font-size: 15px; }
    .note.warn  { border-left-color: var(--a-ochre);  background: var(--a-ochre-soft); }
    .note.green { border-left-color: var(--a-forest); background: var(--a-forest-soft); }
    .callout { background: var(--a-paper); border: 1px solid var(--a-rule);
      border-radius: 4px; padding: 16px 20px; margin: 18px 0; }
    .role-card { background: var(--a-paper); border: 1px solid var(--a-rule);
      border-radius: 4px; padding: 16px 20px; margin: 12px 0; }
    .role-card h4 { margin: 0 0 8px; font-size: 15px; color: var(--a-accent); }
    .role-card .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
      font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--a-muted); }
    .role-card .meta span { background: var(--a-soft); padding: 2px 9px; border-radius: 3px; }
    .step { background: var(--a-paper); border: 1px solid var(--a-rule);
      border-left: 4px solid var(--a-accent); padding: 14px 18px; margin: 12px 0;
      border-radius: 0 4px 4px 0; }
    .step.sub  { border-left-color: var(--a-plum); }
    .step.bash { border-left-color: var(--a-forest); }
    .step.user { border-left-color: var(--a-ochre); }
    .step .who { display: inline-block; padding: 2px 9px; border-radius: 3px;
      font-family: "JetBrains Mono", monospace; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.02em; margin-right: 8px;
      background: var(--a-accent-soft); color: var(--a-accent); }
    .step .who.sub  { background: var(--a-plum-soft);   color: var(--a-plum); }
    .step .who.bash { background: var(--a-forest-soft); color: var(--a-forest); }
    .step .who.user { background: var(--a-ochre-soft);  color: var(--a-ochre); }
    .tree { background: var(--a-pre-bg); color: var(--a-pre-ink); padding: 18px;
      border-radius: 4px; font-family: "JetBrains Mono", monospace; font-size: 13px;
      white-space: pre; overflow: auto; line-height: 1.55; }
    .diagram { background: var(--a-paper); border: 1px solid var(--a-rule);
      border-radius: 4px; padding: 22px; margin: 24px 0; overflow: auto; }
    .diagram-title { font-family: "JetBrains Mono", monospace; font-size: 12px;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--a-accent);
      margin-bottom: 12px; }
    .diagram svg { width: 100%; height: auto; display: block; }
    .figure-caption { color: var(--a-muted); font-size: 13.5px; margin-top: 12px;
      font-style: italic; }
  </style>
</head>
<body>

<div class="eyebrow">这里写小标题（如：Anthropic · skill-creator）</div>
<h1>这里写文章标题</h1>
<p class="lead">这里写一段 lead —— 一两句话概括全文。会用衬线斜体显示。</p>

<h2>1 · 第一章</h2>
<p>正文段落。</p>

<p>行内 <code>code</code>、<strong>加粗</strong>、<em>斜体</em>。</p>

<!-- 各种组件用法见 §4 -->

</body>
</html>
```

写完双击打开预览，跑 `python tools/convert.py drafts/my-new-article.html`，就接入 Jekyll 了。

---

## 4 · 组件库（class 用法）

### 4.1 `.callout` — 通用信息盒子

```html
<div class="callout">
  <p>白底 + 灰边框的中性信息盒。</p>
</div>
```

### 4.2 `.note` / `.note.warn` / `.note.green` — 语义化高亮

```html
<div class="note"><strong>Note：</strong>蓝灰底，info 用。</div>
<div class="note warn"><strong>注意：</strong>米黄底，警示用。</div>
<div class="note green"><strong>结论：</strong>豆绿底，"好"或确认。</div>
```

### 4.3 `.role-card` — 角色 / 概念卡

```html
<div class="role-card">
  <h4>① 主 Agent</h4>
  <p>这个角色干什么……</p>
  <div class="meta">
    <span>剧本：SKILL.md</span><span>身份：当前会话</span>
  </div>
</div>
```

### 4.4 `.step` / `.step.sub` / `.step.bash` / `.step.user` — 时序步骤

```html
<div class="step">
  <span class="who">主 agent</span><strong>第一步做什么</strong>
  <p>详细描述。</p>
</div>
<div class="step sub">
  <span class="who sub">subagent</span><strong>第二步</strong>
  <p>……</p>
</div>
```

`.who` 徽章颜色：默认 = 主 agent（rust）、`.sub` = subagent（plum）、`.bash` = 脚本（forest）、`.user` = 用户（ochre）。

### 4.5 `.tree` — 文件树 / 目录列表

```html
<div class="tree">my-project/
├── src/
│   ├── main.py
│   └── lib.py
└── README.md
</div>
```

注意是 `<div class="tree">` 不是 `<pre>`，里面用纯文本 ASCII，靠 `white-space: pre` 保留缩进。

### 4.6 `.diagram` — SVG 流程图容器

```html
<div class="diagram">
  <div class="diagram-title">图 1：流程总览</div>
  <svg viewBox="0 0 980 400" role="img">
    <!-- SVG 内容 -->
  </svg>
  <p class="figure-caption">图例说明。</p>
</div>
```

### 4.7 `<table>` — 数据表格

```html
<table>
  <thead><tr><th>列 1</th><th>列 2</th></tr></thead>
  <tbody>
    <tr><td>数据 a</td><td>数据 b</td></tr>
  </tbody>
</table>
```

样式自动应用：深色 thead + 等宽小字标题、衬线 td 内容、行底分隔线。

### 4.8 `<pre><code>` — 代码块

```html
<pre><code>def hello():
    return "world"</code></pre>
```

## 5 · 图表配色规范

**核心原则：** 图（SVG diagram）允许有多种颜色，因为颜色是有功能性的 —— 用来区分角色、阶段、状态。但所有颜色都来自下面这套语义色板，**不允许临时调色**。

### 5.1 语义色板

| 角色 / 含义 | 强调色（stroke / text） | 浅底（fill） | 深底（stroke） | CSS 变量 |
|---|---|---|---|---|
| **主流程 / 主 agent / Primary** | `#8b3a2f` | `#f5ebe6` | `#c9a89e` | `--a-accent*` |
| **派生 / subagent / Secondary** | `#7a3a5c` | `#f1e6ec` | `#b88aa0` | `--a-plum*` |
| **脚本 / 自动化 / Success** | `#4a6f3a` | `#ecf0e6` | `#a8c0a0` | `--a-forest*` |
| **用户 / 警示 / Warning** | `#a07020` | `#f5ecdb` | `#d4a86a` | `--a-ochre*` |
| **Info / Note / Neutral cool** | `#2a6470` | `#e6eef0` | `#9ab8be` | `--a-teal*` |
| **中性 / 灰** | `#6b6b6b` (muted) / `#9a9a9a` (faint) | `#f5f1ea` (soft) | `#e6e3dc` (rule) | `--a-muted` / `--a-rule` |

**怎么用：**

- 一个流程图里**不要超过 4 种颜色**，每种颜色必须对应一个明确的"角色"或"阶段"
- 同一个角色的 box，在同一张图里只能用一种颜色（不要为了好看混搭）
- 箭头默认用 `--a-accent` 的暗赭红；反馈 / 回退用 `--a-ochre`
- 图下方建议补一段 `.figure-caption`，写清楚每种颜色代表什么

### 5.2 在 SVG 里直接用 hex

SVG 的 `fill` / `stroke` 属性不能用 CSS 变量（attribute vs property 区别）。直接写 hex：

```html
<svg viewBox="0 0 600 200">
  <!-- 主 agent 用 rust 系 -->
  <rect x="20" y="40" width="160" height="60" rx="6"
        fill="#f5ebe6" stroke="#c9a89e"/>
  <text x="100" y="75" text-anchor="middle"
        font-size="13" font-weight="700" fill="#8b3a2f">主 Agent 做的事</text>

  <!-- subagent 用 plum 系 -->
  <rect x="220" y="40" width="160" height="60" rx="6"
        fill="#f1e6ec" stroke="#b88aa0"/>
  <text x="300" y="75" text-anchor="middle"
        font-size="13" font-weight="700" fill="#7a3a5c">Subagent</text>

  <!-- 箭头 -->
  <line x1="180" y1="70" x2="220" y2="70"
        stroke="#8b3a2f" stroke-width="2" marker-end="url(#ar)"/>
</svg>
```

### 5.3 文字图例

```html
<p class="figure-caption">
图例：
<span style="background:#f5ebe6;padding:1px 8px;border-radius:3px;">主 agent</span>
<span style="background:#f1e6ec;padding:1px 8px;border-radius:3px;">subagent</span>
<span style="background:#ecf0e6;padding:1px 8px;border-radius:3px;">Python 脚本</span>
<span style="background:#f5ecdb;padding:1px 8px;border-radius:3px;">用户</span>
</p>
```

---

## 6 · `convert.py` 用法

```bash
# 最简：自动用文件名作 slug，date 用今天
python tools/convert.py drafts/my-new-article.html

# 指定参数
python tools/convert.py drafts/my-new-article.html \
  --slug agent-loop-design \
  --date 2026-05-19 \
  --excerpt "拆解一个朴素 agent loop 的 5 个故障模式" \
  --lang zh-CN

# 覆盖已存在的输出
python tools/convert.py drafts/my-new-article.html --force
```

**做的事：**
1. 读 `<title>` → 作为 front-matter title
2. 抽取 `<style>` 块，把里面所有 CSS 规则用 `.art-body` 作用域包起来（这样 `body { ... }` 不会污染站点 nav）
3. 剥掉外层 `<!doctype>` / `<html>` / `<head>` / `<body>` / `<article>`
4. 剥掉文章自己的第一个 `<h1>`（layout 会用 front-matter 标题渲染一次 H1，避免重复）
5. 输出到 `_articles/<slug>.html`，前面带 YAML front-matter

**不做的事：**
- 不改 HTML 结构（除了上面提到的剥外壳）
- 不改 SVG 颜色
- 不重写你的 CSS class 名

---

## 7 · Markdown 短笔记规范

`_posts/YYYY-MM-DD-slug.md`：

```markdown
---
title: "Welcome to my site"
excerpt: "A short note about the purpose of this site."
---

正文用 Markdown 写。`_layouts/post.html` 会自动包站点 chrome。

代码：`inline` 或

​```python
print("hello")
​```
```

样式由 `assets/css/style.scss` 里的 `.prose` 区块控制。

---

## 8 · 现有 6 篇文章迁移状态

| 文件 | 状态 | 占位日期 |
|---|---|---|
| `skill-creator-running-mechanism.html` | ✅ 已用 convert.py 转换 + 配色映射 | 2025-11-02 |
| `article-1-system-prompt.html` | ✅ 已转换 + 配色映射 | 2025-10-18 |
| `article-2-context-management.html` | ✅ 已转换 + 配色映射 | 2025-09-30 |
| `skill-memory-mechanism.html` | ✅ 已转换 + 配色映射 + 保留中英对照功能 | 2025-09-12 |
| `article-3-session-transcript.html` | ✅ 已转换 + 配色映射 | 2025-08-28 |
| `article-4-cache-edits.html` | ✅ 已转换 + 配色映射 | 2025-08-14 |

**请用真实写作日期覆盖 `date` 字段。** 从 git log 拿：

```bash
git log --diff-filter=A --follow --format=%aI -- _articles/<filename> | tail -1
```

---

## 9 · 写新文章 checklist

写完一篇新 HTML 文章前对照一遍：

- [ ] 文件 slug 是 kebab-case 英文
- [ ] `<title>` 有内容
- [ ] 文件能双击独立打开看
- [ ] 用了模板里的 class（`.note` / `.callout` / `.role-card` / `.step` / `.diagram` / `.tree`），没有发明新的
- [ ] SVG 配色只用 §5 的语义色板里的 hex
- [ ] 跑过 `python tools/convert.py path/to/file.html`，输出到 `_articles/`
- [ ] `bundle exec jekyll serve` 本地验证 `/writing/<slug>/` 能正常渲染
- [ ] `git commit && push`
