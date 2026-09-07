---
title: "DeepSeek Harness 插件开发体系：从概念到实践"
excerpt: "从 Fiber、可逆效应、Service 和 Composition 出发，拆解 DeepSeek Harness 的插件运行时与开发方法。"
---


> 本文基于对 DSH 源码和实际插件开发经验整理。可逆效应与响应式共效应的背景见 [段小草知乎](https://www.zhihu.com/question/2071375581464343126/answer/2071477434554249696)。

[![DeepSeek Harness 架构图：以 Cordis 组合内核连接交互层、运行时层级、工具流水线与插件能力](/assets/articles/deepseek-harness-plugin-system/architecture.png)](/assets/articles/deepseek-harness-plugin-system/architecture.png)

## 一、核心理念：一切皆插件、插件皆可逆

DSH 的所有能力——工具、人格、权限、沙箱、UI、会话管理——全部以 **Cordis 插件** 的形式存在。没有哪一层是"硬编码"的；改变一个 agent 能做什么，就是改变为它组合了哪些插件。一切皆插件、插件皆可逆，因此可以热拔插，支持后续 agent 自进化。

理解 DSH 需要掌握：**Fiber**（插件怎么活）、**插件**（写什么）、**Composition**（怎么组合）、**Service**（怎么共享能力）。

| 名词                 | 一句话                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Plugin（插件）**     | 导出 `inject` / `apply` 或 `Service` 子类的 JS 模块，描述「提供什么能力」。                                  |
| **Plugin Runtime** | 同一插件 callback 在进程内的共享元数据（名称、`Config` schema、已加载 fiber 列表）；多行 row 加载同一包时共享一个 Runtime。     |
| **Fiber**          | 一次 `ctx.plugin()` / loader `apply` 产生的活实例，拥有自己的 `ctx`、状态和 disposer 链。                    |
| **Fiber Tree**     | 各 fiber 通过 parent `ctx` 串成的树：Host composition → agent preset 子树 → `cordis:group` 内子 row。 |
| **row / Entry**    | `agent.cordis.yml` 里一行配置；loader 加载它时通常创建一个 fiber。                                        |
| **Composition**    | 由多行 row 组成的 YAML 插件列表（`cordis.patch.yml`、`agent.cordis.yml` 等）。                          |
| **ctx（Context）**   | fiber 的运行时上下文；`apply(ctx)` 里注册副作用、读写 Service 都通过它。                                       |
| **apply**          | 插件激活时 Cordis 调用的入口函数，在这里 `register`、`provide`、`on` 等。                                    |
| **inject**         | 声明硬依赖的 Service 名；未就绪时 fiber 停在 `PENDING`，提供方消失则 unload（共效应）。                             |
| **Service**        | 插件通过 `ctx.provide` 发布的具名能力；消费方用 `inject` 或 `ctx.get` 获取。                                 |
| **ctx.effect**     | 可逆效应入口：加载时执行主体，unload 时 LIFO 执行返回的 disposer。                                             |
| **disposer**       | 清理函数；撤销一次注册、关定时器、注销 Service 等。                                                           |
| **preset**         | 自包含的 agent 能力包目录，核心是 `agent.cordis.yml`；mount 到 session 的 agent scope。                   |

---

## 二、Cordis Fiber

**Fiber** 是 Cordis 里「一个插件实例」的运行时对象。`agent.cordis.yml` 里一行 row 被 loader 加载后得到一个 fiber；`ctx.plugin(child)` 会再创建一个子 fiber。

### 2.1 和 `ctx` 的关系

每个 fiber 拥有自己的 **`ctx`**（`ctx.fiber` 指回这个 fiber）。你在 `apply(ctx)` 里调用的 `ctx.tools.register`、`ctx.on`、`ctx.provide` 等，副作用都挂在这个 fiber 上，而不是飘在全局。

| 概念               | 含义                   |
| ---------------- | -------------------- |
| **Plugin / row** | 源码 + 配置（可多次加载）       |
| **Fiber**        | 某次加载后的活实例            |
| **Runtime**      | 同一插件 callback 的共享元数据 |

手动拿 fiber 句柄的典型写法：`const fiber = ctx.plugin(child)`，需要时 `await fiber.dispose()` 只停这个子插件。

### 2.2 生命周期

```
PENDING → LOADING → ACTIVE → UNLOADING → DISPOSED
                 ↘ FAILED
```

| 状态 | 含义 |
|---|---|
| `PENDING` | `inject` 的 Service 尚未就绪，`apply` 还没跑 |
| `LOADING` / `ACTIVE` | `apply` 正在跑 / 已跑完 |
| `UNLOADING` | disposer 正在执行 |
| `DISPOSED` | 实例已拆除 |

触发 unload 的常见原因：session 结束、`cordis_stop`、HMR、配置 update、**`inject` 的提供方消失**（见 §4.3 共效应）。

### 2.3 可逆效应与 LIFO

unload 时，fiber 收集的所有 disposer **倒序**执行（LIFO）——后注册的副作用先拆。这就是 Cordis 对「可逆效应」的实现：`ctx.effect()` 在加载时跑主体、卸载时跑返回的清理函数；`register` / `on` / `provide` 内部也是 `ctx.effect`，**`apply` 里直接调即可**，stop 时自动撤销。

只有 Cordis **不知道**的资源须手写 `ctx.effect` 或手动调 disposer，例如 `styles.insert`、`setInterval`（或用 `ctx.timer`）。多步拆除须串行时，写在一个 return 函数里依次 `await`。

卸载后恢复的是**观察等价**：工具从 registry 消失、slot 不再渲染、模型/UI 再也调不到——不要求内存与加载前完全相同，session 历史也不会因此抹掉。

### 2.4 DSH 里常见的 fiber

| 场景 | fiber |
|---|---|
| Host composition 里的 `tools`、`llm` | 进程级单例 fiber，所有 session 共享 |
| agent preset 里一行 row | 每 session 一份，session 结束 dispose |
| `cordis_run` 动态插件 | 内存中的 fiber，`cordis_stop` dispose |
| `ctx.plugin(child)` | 子 fiber，随父 fiber unload |

---

## 三、插件（Plugin）

插件是一个 JS 模块，导出 `{ inject, apply }`。Cordis loader 加载它后调用 `apply(ctx)`，插件在这个函数里注册自己的全部贡献。

### 3.1 插件结构

```js
// 声明硬依赖：插件会挂起等待这些 Service 出现后才激活
var inject = ['slots'];
// Cordis 调用此函数激活插件
function apply(ctx) {
  // ① Cordis 不知道的 → 须自己管可逆（或包进 ctx.effect）
  var disposeCss = styles.insert('.my-class { color: red; }');
  // ② 软依赖：无共效应，slots 没有也能跑（见 §4.3 inject vs get）
  var slots = ctx.get('slots');
  if (slots === undefined) { disposeCss(); return; }
  // ③ slots.inject/register 内部已是 effect，但 styles 不是 → 下面要打包
  var injectDisp = slots.inject('conversation.chat.node', function () {
    return slots.register(  // register 内部 ctx.effect，stop 时自动撤销
      { name: 'conversation.chat.node', key: 'workflow-run' },
      MyComponent
    );
  });
  // ④ 可逆效应：把「Cordis 不知道的」和「想一次清干净的」绑进 fiber
  ctx.effect(function () {
    return function () { injectDisp(); disposeCss(); };  // LIFO：后注册的先拆
  }, 'my-plugin');
}
export { inject, apply };
```

Host 工具插件更简——**不必** `ctx.effect` 包 `register`：

```js
export const inject = ['tools'];
export function apply(ctx) {
  ctx.tools.register(myTool);  // 内部已是 effect；stop / cordis_stop 自动撤销
}
```

### 3.2 关键 API

| API | 作用 | 可逆机制 |
|---|---|---|
| `inject: ['xxx']` | 硬依赖；B 消失则本插件 unload（共效应） | 自动 |
| `ctx.get('xxx')` | 软依赖，可能 `undefined` | 无共效应 |
| `ctx.provide('xxx', value)` | 发布 Service | 内部 `ctx.effect`，stop 注销并 `notify` 依赖方 |
| `ctx.on('event', fn)` | Event listener | 内部 `ctx.effect` |
| `ctx.tools.register(def)` | 注册 Tool | 内部 `ctx.effect`，**不用外包** |
| `slots.register(...)` | 注册 Slot renderer | 内部 `ctx.effect` |
| `ctx.effect(fn, label)` | 可逆效应入口 | 手写：timer、连接、`styles.insert` 等 |
| `styles.insert(css)` | 注入 CSS | **只返回 disposer，不挂 fiber** → 须 `ctx.effect` 或手动调 |
| `harness.registerTool(ctx, def)` | 动态 Tool（创造模式） | 内部走 `tools.register` |
| `harness.handle(method, fn)` | Client→Host RPC | 内部 `ctx.effect` |

### 3.3 两个运行平面

| | Host（Node.js 进程） | Client（浏览器页面） |
|---|---|---|
| **能力** | 文件系统、shell、网络、Agent loop、Session 持久化、模型调用、沙箱/权限 | React UI、主题、布局、页面状态 |
| **可注册** | Service、Event listener、dynamic Tool、RPC handler | Slot renderer、locale dictionary、theme override |
| **全局变量** | `ctx`, `harness`, `console`, `btoa/atob`, `TextEncoder/Decoder` | `React`, `styles`, `host`, `ctx`, `console` |
| **通信** | Host ← Client 通过 `host.call(method, args)` JSON RPC | Host → Client 通过 Slot props 传递数据 |
| **JSX** | N/A | **不支持**，必须用 `React.createElement(type, props, ...children)` |

### 3.4 Dynamic Plugin vs Composition Plugin

| | Dynamic Plugin（临时） | Composition Plugin（固化） |
|---|---|---|
| **创建方式** | `cordis_define` 定义 + `cordis_run` 激活 | 写在 `agent.cordis.yml` 里作为一个 row |
| **存储** | 当前进程内存，重启即消失 | 磁盘文件，每次启动自动加载 |
| **代码位置** | `cordis_define` 的 `code.client`/`code.host` 参数 | 本地 `.js` 文件或 npm 包 |
| **适用场景** | 快速实验、调试、临时扩展 | 需要持久化的正式功能 |

---

## 四、Service

Service 是插件通过 `ctx.provide(name, value)` 注册到 context 的共享对象。其他插件通过 `inject` 或 `ctx.get(name)` 获取它。Service 名是注册时在代码里自己起的字符串，跟 composition row 的 `id`/`name` 无关。

### 4.1 Service 怎么发布

**方式 1：继承 Service 类**（shipped 包用这种）

```js
import { Service } from "@deepseek-ai/cordis";
class SlotsService extends Service {
  constructor(ctx) {
    super(ctx, "slots");  // ← 第二个参数就是 Service 名
  }
  register(options, component) { /* ... */ }
}
```

**方式 2：ctx.provide()**（dynamic plugin 用这种）

```js
function apply(ctx) {
  ctx.provide('myService', {
    doSomething() { return 42 }
  });
}
```

### 4.2 怎么知道有哪些 Service 可以 inject

用 `cordis_inspect_query` 查 `Service.listService`——返回当前 runtime 实际注册的所有 Service。这个列表是动态的，取决于当前 composition 挂载了哪些插件。

### 4.3 响应式共效应：`inject` vs `ctx.get`

`inject` 不是启动时检查一次，而是运行期持续跟踪：提供方消失 → 消费方 fiber **unload**（共效应）；提供方回来 → **reload** 并重新 `apply`。

| | `inject: ['tools']` | `ctx.get('slots')` |
|---|---|---|
| B 启动时 | 等到 B 存在才 `apply` | 立刻 `apply`，可能 `undefined` |
| B **运行中**消失 | 本插件 **unload**（disposer 全跑） | 本插件 **继续跑** |
| B 再出现 | **reload**，重新 `apply` | 仍 `undefined`，除非你轮询 |

典型：`cordis_stop` 停掉 `workflowEngine` 提供方 → `inject: ['workflowEngine']` 的消费方自动 unload；`workflow-graph-ui` 用 `ctx.get('slots')` 则只是不渲染 UI。

### 4.4 常用 Service 速查

| Service | 平台 | 作用 | 典型方法 |
|---|---|---|---|
| `tools` | Host | 工具注册表 | `register(definition)` |
| `systemPrompt` | Host | prompt 组装 | `section({name, text})` |
| `slots` | Client | UI Slot 注册 | `register({name, key}, component)` |
| `timer` | 两者 | 可清理定时器 | `timeout(fn, ms)` |
| `fs` | Host | 沙箱文件系统 | `readText(target)` |
| `subagents` | Host | 子 agent 管理 | `start(name, request)` |
| `workflowEngine` | Host | workflow 引擎 | `start(request)` |
| `llm` | Host | 模型调用 | `stream(options)` |
| `sessions` | Host | session 管理 | `get(id)` |
| `commands` | Host | slash 命令 | `register(definition)` |

---

## 五、Composition

Composition 是 Cordis 的配置文件（YAML），里面每一行（row）是一个插件。Cordis loader 启动时逐行 import 并 `apply`。

### 5.1 row 的字段

```yaml
- id: tool-fs                          # 人类可读标识符（同 group 内唯一）
  name: '@deepseek-ai/dsh-tool-fs'     # 要加载什么：
                                        #   '@xxx/yyy' → npm 包
                                        #   './xxx.js' → 本地文件（相对于 preset 目录）
                                        #   'cordis:group' → 内置分组容器
  config:                               # 传给 apply(ctx, config) 的配置
    sampleOverCapGlobResults: false
  inject: ['fs']                        # 硬依赖的 Service（可选，可省略）
  disabled: true                        # 禁用此 row（可选）
  isolate:                              # realm 隔离（仅当插件 publish service 时需要）
    workflowEngine: true
```

### 5.2 四层叠加

启动一个 DSH session 时，composition 按层从底往上叠加。每一层用 **patch 语义**：相同 `id` 的 row 后层覆盖前层的 `config`；`insert` 往前层列表追加新 row。

```
第 1 层: dsh-base/cordis.patch.yml        ← 进程级基础设施（所有模式共享）
         ~80 个 row：timer, llm, session, agent, fs-sandbox, tools, ...
第 2 层: dsh-web-app/cordis.patch.yml      ← Web 模式（浏览器、HTTP、API gateway）
     或   dsh-headless/cordis.patch.yml     ← Headless 模式（无 UI，直接跑任务）
第 3 层: agent.cordis.yml (preset)         ← 你能编辑的层：工具、人格、prompt section
第 4 层: 用户 --patch overlay             ← 命令行临时覆盖（可选）
```

### 5.3 Host composition vs Agent preset

| | Host composition | Agent preset |
|---|---|---|
| **角色** | 进程级单例，发布 Service | 每 session 一份，消费 Service |
| **实例数** | 一个实例服务所有 session | session 结束时卸载 |
| **内容** | 注册表、工厂、基础设施 | 工具、人格、prompt section |
| **编辑** | 正常不编辑（属于部署） | 可以自由复制和编辑 |
| **文件** | npm 包内的 `cordis.patch.yml` | `~/.dsh/.agent-presets/\<id>/agent.cordis.yml` |

Host composition 的 Service 是进程级单例。如果放进 preset（每 session 一份），第二个 session mount 同一个 preset 就会冲突——这就是 `isolate` realm 存在的原因。

### 5.4 isolate realm 规则

**"A row that publishes a service may not sit loose in a preset."**

如果一个插件通过 `ctx.provide()` 发布 Service，它必须放在一个带 `isolate` realm 的 group 里，否则 Service 会注册到 root realm，第二个 session mount 同一个 preset 时 Service 名重复注册，mount 拒绝。

```yaml
# 正确：workflow 引擎和它的消费者都包在 group + isolate 里
- id: delegation
  name: cordis:group
  group: true
  isolate:
    workflowEngine: true          # ← entry-local realm，每个 session 独立实例
  config:
    - id: workflow-worker-thread   # 发布 workflowEngine Service
      name: '@deepseek-ai/dsh-workflow-worker-thread'
    - id: tool-workflow            # 消费 workflowEngine Service
      name: '@deepseek-ai/dsh-tool-workflow'
# 也正确：不发布 Service 的 row 不需要 realm
- id: workflow-graph-ui
  name: ./workflow-graph-ui.js    # 只注册 Slot renderer，不 publish Service
```

---

## 六、Preset

Preset 是一个自包含的能力包目录，定义了一个 agent 的工作模式。

### 6.1 目录结构

```
~/.dsh/
├── .agent-presets/                     ← 用户 preset 根目录
│   ├── cordis-wfg/                     ← 一个 preset
│   │   ├── agent.cordis.yml            ← 必须：插件 row 列表
│   │   ├── preset.yml                  ← 可选：显示名 + 描述
│   │   └── workflow-graph-ui.js        ← preset 专属插件（放在 preset 目录里）
│   │
│   ├── bash-only/                      ← 另一个 preset
│   │   ├── agent.cordis.yml
│   │   └── preset.yml
│   │
│   └── (shipped presets 在 npm 包的 config/agent-presets/ 下)
│       ├── standard/                   ← 完整编码 agent
│       ├── cordis/                     ← standard + 自修改能力
│       ├── code/
│       └── minimal/
│
└── plugins/                            ← 共享插件目录（可选，约定俗成）
    └── workflow-graph-ui.js            ← 多个 preset 共用的插件放这里
```

### 6.2 两个文件

**`agent.cordis.yml`（必须）**——preset 的核心，一个 plugin row 列表：

```yaml
- id: persona
  name: '@deepseek-ai/dsh-persona'
  config:
    text: You are a coding agent...
- id: tool-pwsh
  name: '@deepseek-ai/dsh-tool-pwsh'
- id: workflow-graph-ui
  name: ./workflow-graph-ui.js        # 相对路径，相对于 preset 目录
```

没有这个文件 = 没有 preset，loader 找不到任何 row，session 无法启动。

**`preset.yml`（可选）**——只在 preset 选择器里显示名字和描述：

```yaml
name: Cordis + Workflow Graph
description: 完整编码 Agent + Workflow SVG 图可视化。
```

没有它也能工作，只是选择器里显示目录名而非友好名称。

### 6.3 本地插件文件引用

Cordis loader 的 `import()` 处理 row 的 `name` 字段时：

- 以 `@` 开头 → npm 包名，走 `import(name)`
- 以 `cordis:` 开头 → 内置插件
- 以 `.` 开头 → 相对路径，走 `import(new URL(name, ctx.baseUrl))`

`ctx.baseUrl` 是 preset 目录的 `file://` URL。相对路径不限于同目录，可以向上走。所以插件文件有两种放置策略：

**放在 preset 目录里**（自包含，复制 preset 时一起带走）：

```yaml
- id: workflow-graph-ui
  name: ./workflow-graph-ui.js        # 同目录
```

**放在共享插件目录里**（多个 preset 复用同一个插件，改一处全局生效）：

```yaml
- id: workflow-graph-ui
  name: ../../plugins/workflow-graph-ui.js   # 向上走到 ~/.dsh/plugins/
```

不需要发布 npm 包——本地 `.js` 文件就够了。两种策略按需选择：preset 专属插件放在一起，通用插件放共享目录。

### 6.4 创建 preset 的正确方式

**从 copy 开始，不要从零写。**

```
1. 用 agentPresets.copy(from, id, name) 从 shipped preset 复制
2. 编辑副本的 agent.cordis.yml：增/删/改 row
3. 把本地插件 .js 文件放在 preset 目录下
4. 用 agentPresets.standingKeyFor(id) mount-validate
5. 在 preset picker 里选新 preset 开 session
```

**永远不要编辑 shipped preset**——它在 npm 包目录里，升级时会被覆盖，改坏 `cordis` preset 会禁用 preset 创作模式本身。

---

## 七、一个完整的插件示例

以下是一个真实运行过的 Client 插件，用 SVG 泳道图替换 workflow-run 面板。完整源码（含教学注释）在 `~/.dsh/.agent-presets/cordis-wfg/workflow-graph-ui.js`。

```js
var inject = ['slots'];
function WorkflowGraphPanel(props) {
  // props.node.data 由 shipped 的 workflow-run Definition 生成：
  // { name, status, phases: [{ key, phase, members: [{ seq, label, status }] }] }
  var data = props.node.data;
  var phases = data.phases || [];
  // 布局计算：每个 phase 是一列，agent 节点纵向排列
  var nodeR = 14;
  var colW = 120;
  var phaseGap = 28;
  var svgW = phases.length * colW + (phases.length - 1) * phaseGap + 60;
  // 构建 SVG 元素（不能用 JSX，必须用 React.createElement）
  return React.createElement('div', { className: 'wfg-root' },
    React.createElement('svg', {
      className: 'wfg-svg',
      viewBox: '0 0 ' + svgW + ' ' + svgH
    },
      // phase 背景框 + agent 节点圆圈 + 连接线...
    )
  );
}
function apply(ctx) {
  var disposeCss = styles.insert('.wfg-root { ... }');
  var slots = ctx.get('slots');
  if (slots === undefined) { disposeCss(); return; }
  // 两步协议：inject 等 Slot 声明 → register 注册 renderer
  var injectDisp = slots.inject('conversation.chat.node', function () {
    return slots.register(
      { name: 'conversation.chat.node', key: 'workflow-run' },
      WorkflowGraphPanel
    );
  });
  // 注册 disposer
  ctx.effect(function () {
    return function () { injectDisp(); disposeCss(); };
  }, 'workflow-graph-ui');
}
export { inject, apply };
```

对应的 composition row：

```yaml
- id: workflow-graph-ui
  name: ./workflow-graph-ui.js
```

---

## 八、Cordis 创造模式工具

当 agent 运行在 `cordis` preset 上时，除了标准的编码工具（read/write/edit/grep/glob/pwsh 等），还获得一组**运行时自修改工具**。这些工具让 agent 能在当前进程中定义、激活、停止动态插件——也就是"创造模式"。

### 8.1 动态插件生命周期工具

| 工具 | 作用 | 关键细节 |
|---|---|---|
| `cordis_define` | 定义一个不可变的 Package（插件的一个版本） | `kind: "new"` 创建新 Plugin（只需 3-6 字母前缀，Host 分配最终 ID）；`kind: "existing"` 往已有 Plugin 追加新版本。只校验和记录源码，不执行 |
| `cordis_run` | 激活一个 Package | `mode: "run"` 首次激活/重启/回滚；`mode: "update"` 从当前版本切换到另一版本。Client 插件需要用户批准，返回 `awaiting-approval`；批准后返回 `starting` 异步加载 |
| `cordis_stop` | 停止当前 Run，保留定义和版本指针 | = fiber `dispose`：可逆效应倒序撤销 + 共效应通知 `inject` 依赖方 unload |
| `cordis_undefine` | 永久删除 Plugin 及所有 Package | 先 stop 再删除。删除后 pluginId、packageId、@引用全部失效 |

### 8.2 运行时检查工具

| 工具 | 作用 | 何时用 |
|---|---|---|
| `cordis_inspect_list` | 列出所有 Inspect Provider 及其方法 | 写插件前，先查有哪些 Service/Event/Slot/Theme 可用 |
| `cordis_inspect_query` | 执行 Inspect Provider 的只读查询 | 查确切 Service 方法签名、Event listener 契约、Slot 注册协议、Theme token、Tool schema |
| `cordis_inspect_self` | 检查当前 Session 的动态 Plugin | 不传参列出所有 Plugin；传 pluginId 看版本指针和 Package 摘要；传 pluginId + packageId 看源码和运行时诊断 |

这三个工具是**只读的**——它们不修改运行时，只读取当前能力目录和已定义插件的状态。Inspection 结果是 API 契约的来源，不是业务数据。

### 8.3 工作流和委派工具

| 工具 | 作用 |
|---|---|
| `workflow` | 运行 JS 编排脚本，通过 `agent()`/`pipeline()`/`parallel()`/`phase()` 动态编排多个隔离子 agent |
| `subagent` | 委派一个独立任务给子 agent（不继承父对话上下文） |
| `subagent_fork` | 委派任务给继承父对话上下文的子 agent |
| `ralph` | 运行 fresh-agent Ralph 循环（每轮开新子 agent，共享 workspace 作长期记忆） |
| `send_message` | 给后台子 agent 发消息，继续同一对话 |
| `interrupt_agent` | 取消后台子 agent 的当前 turn |
| `list_agents` | 列出可继续的后台子 agent |

### 8.4 标准工具（非 Cordis 特有）

| 工具 | 作用 |
|---|---|
| `read` / `write` / `edit` | 文件读写编辑（经沙箱） |
| `glob` / `grep` | 文件搜索 |
| `pwsh` | PowerShell 执行（经沙箱） |
| `web_search` / `net_search` | 网络搜索 |
| `todo_write` | 任务清单 |
| `ask_user_question` | 向用户提问 |
| `skill` | 加载 skill 指令 |
| `exit_plan_mode` | 退出 plan mode（plan mode 专用） |
| `get_goal` / `create_goal` / `update_goal` | 长任务目标管理 |
| `job_list` / `job_output` / `job_kill` | 后台任务管理 |
| `uuid` / `hash` / `read_image` | 工具函数 |

### 8.5 动态插件开发流程

```
1. cordis_inspect_list    → 发现当前可用的 Provider 和方法
2. cordis_inspect_query   → 查确切的 Service/Event/Slot 契约
3. cordis_define          → 定义插件源码（code.host 和/或 code.client）
4. cordis_run             → 激活插件（Client 端需用户批准）
5. cordis_inspect_self    → 检查运行时状态和诊断
6. 如失败 → 修复源码 → cordis_define 追加新版本 → cordis_run(update)
7. cordis_stop            → 临时停止（保留定义）
   cordis_undefine        → 永久删除
```
