---
title: "ChatGPT Memory 机制逆向：存储结构、更新机制与消费方式"
excerpt: "从实际上下文与历史检索观察，拆解 ChatGPT 的长期画像、近期会话、Dreaming 更新与按需历史检索。"
lang: zh-CN
---

*2026 年 10 月 28 日 · 基于 ChatGPT Chat 实际运行观察、社区逆向与官方资料*

ChatGPT 的 Memory 并不是简单的“提取用户事实 → 存储到向量数据库 → RAG 检索”。

通过社区逆向，以及对当前 ChatGPT 实例实际获得的上下文和历史检索能力的观察，可以还原出一套更具体的架构：

**ChatGPT 将长期用户画像和近期聊天记录预先放入模型上下文，再通过独立的历史检索能力，按需获取更久远的会话细节。长期画像由后台 Dreaming 机制持续综合更新。**

本文只研究 ChatGPT Chat，不讨论 Codex Memory，也不以 OpenAI 专利作为生产实现的证据。

为了区分事实与猜测，使用四种证据标记：

- **[实测]** 当前 ChatGPT 实例直接获得的上下文或工具调用结果。
- **[社区实测]** 独立研究者通过多个账号和行为实验获得的结果。
- **[官方]** OpenAI 明确公开的产品机制。
- **[推断]** 与观察结果一致，但内部实现尚未证实的解释。

本文描述的是截至 2026 年 10 月的运行机制。尤其需要注意：**模型实际收到的上下文格式，不等于 OpenAI 后台数据库的物理存储 Schema。**

## 一、存储结构

### 1.1 整体结构

目前可以观察到，ChatGPT 的记忆相关数据至少有以下几种逻辑形态：

| 逻辑结构 | 内容 | 主要用途 |
|---|---|---|
| User Knowledge Memories | 跨会话综合的长期用户画像 | 长期个性化 |
| Recent Conversation Content | 最近会话的标题、时间和消息片段 | 近期工作连续性 |
| User Interaction Metadata | 账号、设备、行为统计等 | 提供运行环境 |
| Chat History | 过去的聊天记录及可检索表示 | 追溯历史细节 |
| Memory Summary | 用户可查看、纠正的记忆概要 | 记忆管理 |

此外，旧版 ChatGPT 使用 `Model Set Context` 保存显式的 Saved Memories。新版 Improved Memory 已将 Dreaming 综合记忆作为核心，但旧版仍是另一种可用的记忆体验。

从数据流来看：

```text
                  原始聊天历史
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
      Recent Conversations   Dreaming
              │              后台综合
              │                 │
              │                 ▼
              │        User Knowledge Memories
              │                 │
              └────────┬────────┘
                       │
                       ▼
                 预加载上下文
                       │
                       ▼
                 当前 ChatGPT
                       │
                       ├── 直接回答
                       │
                       └── 按需检索历史
                                │
                                ▼
                       相关历史会话片段
```

其中，预加载上下文的格式已经能够比较具体地观察到。

### 1.2 User Knowledge Memories：长期画像

这是 Dreaming 生成的核心记忆。

2026 年 6 月，研究者 Shlok Khemani 观察到，ChatGPT 会在推理上下文中放入一份由 LLM 综合生成的、密集的用户画像，并周期性更新。

**[实测] 当前实例存在同名区块，其开头为：**

```text
# User Knowledge Memories

Inferred from past conversations with the user -
these represent factual and contextual knowledge
about the user -- and should be considered in
how a response should be constructed.
```

上述英文说明为排版进行了换行处理。

#### 外层标题是否固定？

目前可以给予较高置信度。

2026 年社区公开的 ChatGPT 上下文样本和当前实例均出现了 `# User Knowledge Memories`，连标题下的英文说明也高度一致。

Shlok 的独立逆向同样观察到了 `User Knowledge Memories` 这一层。

因此可以判断：

**外层字段名与说明文字很可能是 ChatGPT 统一使用的模板；里面的主题、数量及排列方式则由每个用户的实际历史决定。**

这并不能证明所有模型版本、套餐与账号都使用完全相同的模板。

#### 真实的长期画像组织方式

下面展示当前实例实际获得的长期画像。

为了忠实反映结构：

1. **保留全部 11 个一级标题及原有顺序。**
2. 未标注省略的内容，尽量保留原来的表述。
3. `[本文省略：……]` 表示为了文章篇幅或隐私而删除的内容，**不是系统原有的文字或截断标记**。
4. 不把被省略的内容重新改写为虚构的记忆条目。

```text
# User Knowledge Memories

1. COMMUNICATION PREFERENCES
- 主语言中文；可请求*语/**话。
- 时效话题需先检索（2026-02-05）。
- 论文筛选偏严；希望证据强弱标注。
- 输出偏好：短、图示化；多次要求交互式/
  3Blue1Brown 风格；更偏好“一图秒懂”。
- 云端约束（2026-10-19）：
  未经同意不远程登录其本地 Mac，优先云电脑。

2. HARDWARE / ENVIRONMENT（精要）
- MacBook Air（macOS 15.7.3）主力；
  家中 Mac mini（无公网）。
- Windows 11 + WSL2（Ubuntu 22.04）。
- Ascend 910B4 8卡；CANN 8.1.RC1。
- [本文省略：网络代理、域名、移动端环境等条目]

3. SOFTWARE / TOOLING（要点）
- Python 3.10/3.11；
  torch 2.5.1（NPU）。
- Codex CLI、Claude Code、
  OpenClaw/OpenCode/Gemini CLI。
- LLM Proxy（FastAPI）：三协议桥；
  DeepSeek API 可用。
- [本文省略：3D 工具、会计软件、更多版本信息]

4. KEY TECH PROJECTS（核心）
1) Nanochat on Ascend：
   /home/ma-user/work/nanochat；
   HcclAllreduce/超时。
2) Agent-Lightning（GRPO）：
   Qwen2.5-1.5B；bs=32；lr=1e-6。
3) vLLM Ascend：
   GLM-4.1V-9B、Qwen2 bf16。
4) LLM Proxy：
   BAN_EXPLORE/BAN_STREAM/EXPOSE_THINKING。
5) [本文省略：其他项目及工程问题]

5. CAREER / GOALS（长期）
- LLM Agent 从业；
  关注编程代理/多 Agent/自主科研。
- 工程指标：无人干预时长、
  人机节点、worktree/回滚。
- 自建 TDD skill（四类测试）；
  前端验收流程（P0/P1/P2）。
- [本文省略：简历、创业方向和其他目标]

6. CAREER & JOB SEARCH（要点）
- [本文省略：职业经历、岗位选择及求职计划]

7. USER PROJECT — nano-multiagent（自研）
- 仓库：github.com/Mrchen116/nano-multiagent。
- 核心理念：Chat 即 IM 为主界面；
  全局 Agent（inbox+send_message）
  跨会话统一。
- 目标：支撑数天-数月高层任务。
- 任务体系：
  确定性 DAG 与探索树可嵌套；
  主/执行/验收 Agent；
  人审对齐/验收；并发限制与预算。
- 工具设计：
  create_task/propose_plan/request_approval/
  .../reopen_subtask/escalate；
  跨线程仍用 inbox/send_message。

- 近期新增（10-16/17）：
  · Personal Agent（PA）作为首个 Agent：
    读取用户全部 IM、主动性、协助用户任务；
    用户可自命名。
  · PA 关键问题：
    授权边界；是否自动接收全部消息；
    可否被他人/他 Agent 私聊或 @；
    是否需“请求入口”；
    协助用户 Task 与自任务区分。
  · 安全：防套话（他人/他 Agent）；
    Instinct-to-Instinct 交互；授权前置。
  · 评测诉求：7-14 天办公 Episode；
    仅能观察 IM（非桌面全监控）；
    指标“是否主动/是否打扰”。

- Agent Team（10-15）：
  诉求每 Agent 独立 Memory/工具；
  群聊协作。
- [本文省略：简历贡献归纳、CI 与运行问题]

8. RESEARCH FOCUS（2026-08/09/10）
- Auto Research：
  Dream-RSI/EvoScientist/Co-Scientist/
  AI Scientist-v2。
- Orchestration：
  Kimi Tower、Codex 跨 Thread。
- Decision Model（Jev/Decisions）：
  · Jev 实践：
    github.com/Mrchen116/jev-computer-use-skill；
    MiniWoB++ 3×3：9/9，
    成本-52.7%、时间-38.5%。
  · 观点：
    System Two LLM + System One Jev。
  · [本文省略：其他实验、API 对比和技术判断]
- Memory：
  mem0、ContextFS（三层摘要+FTS5）；
  Instinct/Dots 记忆结构研究。
- [本文省略：Harness、PA 主动性等研究条目]

9. HEALTH / SELF-REFLECTION
- [本文省略：健康和个人反思信息]

10. PERSONAL FACTS / TASKS
- [本文省略：家庭与个人生活信息]
- [本文省略：室内建模、旅游项目等详细约束]

11. MODEL / PROVIDER（近期）
- [本文省略：模型订阅、使用量和预算记录]
```

这个示例说明了几个重要事实。

**第一，画像内部不是固定 Schema。**

`COMMUNICATION PREFERENCES`、`USER PROJECT — nano-multiagent` 这样的标题属于当前实例的主题组织结果。其他用户可能使用不同的分类名称和数量。

**第二，不只是简单的用户事实列表。**

例如第七节包含项目理念、任务架构、工具接口、过去的设计讨论、尚未解决的问题，以及带日期的近期进展。

**第三，不同主题的详细程度差异很大。**

有些主题只需要几个事实，复杂的技术项目则可以占据相当长的篇幅。

**第四，画像已经包含摘要和压缩。**

例如 `RESEARCH FOCUS` 中，多个研究方向被压缩到同一个主题下。即使把完整画像提供给模型，也不代表原始聊天的所有细节都还在。

当前实例提供的画像有 11 个一级主题，整体属于数千字量级；上述示例省略了大量内容，不能用其长度推断真实画像的 Token 数量。

Shlok 的账号则观察到了约十段密集画像。由此可以确定的是主题数量与内容规模因用户而异，而非系统规定每人必须生成 11 段。

### 1.3 Recent Conversation Content：近期会话

这是另一层直接提供给模型的上下文。

2025 年，安全研究者 Johann Rehberger（Wunderwuzzi）在两个 ChatGPT 账号上观察到约 40 个近期会话，并确认其中包含标题、时间戳及用户消息。

2026 年，Shlok 也观察到类似格式。

**[实测] 当前实例收到的区块开头为：**

```text
# Recent Conversation Content

Users recent ChatGPT conversations,
including timestamps, titles, and messages.

User messages are delimited by ||||.
Assistant messages are delimited by ::::.
```

其后按会话组织相关内容。

#### 一条没有被人为缩略的短会话

以下是当前实例中一条实际存在的近期会话，除了排版换行，没有缩略用户消息：

```text
20261026T09 SSD寿命与Codex写入量:
||||固态硬盘寿命主要是读还是写影响，
codex天天一大堆写入，我怕硬盘顶不住了
||||大量写日志，然后周期性删除，
是不是也很消耗
```

可以观察到：

- `20261026T09`：会话日期和时间。
- `SSD寿命与Codex写入量`：会话标题。
- `||||`：用户消息分隔符。
- 之后的文本：用户在这个 Thread 中的消息。

这些内容并非每次都重新概括成语义摘要，部分短会话的用户输入能够相当完整地保留。

#### 长会话会发生什么？

当前实例还有以下记录：

```text
20261027T14:57 调研DSH跨线程协作:
<<conversation too long; truncated>>
||||请帮我调研 DSH 是否已有插件或原生工具，
支持类似 Codex 桌面版的跨 thread 协作。

[本文省略：用户在同一条消息中列举的具体能力]

||||是不是还有一个基于DSH的开源项目，
做的personal agent。

[本文省略：同一消息后续内容]
```

这里必须区分两个标记：

- `<<conversation too long; truncated>>`：**系统提供的上下文本身就带有的截断标记**。
- `[本文省略：……]`：为了文章展示而人为删去的文本，原本不属于系统输出。

所以 Recent Conversation Content 至少存在两类内容限制：

**会话级窗口限制：** 只有部分近期会话进入这个区块。不同账号可能有差异，社区观察值约为 40 个。

**单会话截断：** 一旦某段聊天过长，可能只保留部分内容，而不是整段 Thread 完整进入上下文。

早期研究者观察到 Recent Conversation Content 主要包含用户消息，不包含完整的 Assistant 回复。当前格式虽然显式定义了 `::::` 作为 Assistant 消息分隔符，但不能据此断言全部 Assistant 输出都会被保留。

因此，Recent Conversation Content 更接近**有限窗口内的近期工作记录**，而不是完整的聊天数据库。

### 1.4 User Interaction Metadata：交互元数据

这一层也直接出现在当前上下文中。

例如：

```text
# User Interaction Metadata

Auto-generated from ChatGPT request activity.

Reflects usage patterns, but may be imprecise
and not user-provided.

User's account is 154 weeks old.

User is currently using ChatGPT
in a web browser on a desktop computer.

User's average conversation depth is 5.2.

User's average message length is 1186.9.

User is active 5 days in the last 7 days.
```

这里的数字来自当前实例观察；不是固定值，也不代表其他用户。

几个字段值得特别区分：

| 字段 | 含义 |
|---|---|
| `account is ... weeks old` | 账号年龄 |
| `average message length` | 用户消息的平均长度 |
| `average conversation depth` | 平均会话交互深度 |
| `active ... days` | 近期活跃天数 |
| `local hour` | 当前或估计的本地小时 |

其中，`average conversation depth = 5.2` 大致可以理解为用户平均每个聊天进行多少轮交互。

**它不是模型的推理深度，也不是记忆检索深度。**

OpenAI 未公开该指标的精确统计口径，因此不能确认它的分母如何处理分支会话、工具调用或其他特殊消息。

这些元数据可以帮助模型理解当前使用环境，但不应全部归类为 Dreaming 生成的持久记忆。

### 1.5 Memory Summary 不等于底层记忆

2026 年 6 月，ChatGPT 新增了可查看、可纠正的 Memory Summary。

Shlok 通过实验发现：

- Memory Summary 比实际长期画像短得多。
- 重新生成 Summary 可能得到不同的细节组合。
- 用户对 Summary 的自然语言修改会表现为聊天内容。
- 修改 Summary 不代表 User Knowledge Memories 被同步、原地更新。

所以更合理的理解是：

```text
User Knowledge Memories
       │
       ▼
生成 Memory Summary
       │
       ▼
用户阅读 / 提出纠正
       │
       ▼
纠正信息进入后续记忆处理
```

Memory Summary 是**用户界面层的记忆视图**，并非完整后台记忆数据。

---

## 二、存入和更新机制

### 2.1 旧版写入：会话中生成离散事实

2024 年推出的 Saved Memories，主要依靠聊天过程中的记忆写入行为。

例如用户表示：

> 记住我喜欢简洁、技术细节充分的回答。

ChatGPT 可以将其转换为一条显式保存的记忆。

旧版 Memory 的数据表示更接近：

```text
1. [2025-05-02] User prefers concise explanations.
2. [2025-05-04] User works on software engineering.
3. [2025-05-06] User is planning a trip.
```

Wunderwuzzi 在 2025 年将其识别为 `Model Set Context`，并发现这些离散事实与后来自动生成的用户画像可以同时存在。

这一层具有明确的记录感，但也存在更新困难：例如“准备去旅行”可能几个月后不再正确。

### 2.2 新版写入：后台 Dreaming 综合

2025 年 4 月，OpenAI 引入 Dreaming V0；2026 年 6 月 4 日推出 Dreaming V3。

官方明确说明，Dreaming 是一个后台过程，可以综合多个会话，生成与更新长期记忆状态。

与旧版最大的区别是：

**旧版主要在对话中记录事实；新版允许用户正常聊天，再由后台异步抽取和综合值得保留的信息。**

可以将机制理解为快慢两条路径：

```text
用户发送消息
     │
     ▼
聊天历史保存
     │
     ├───────────────────────────┐
     │                           │
     ▼                           ▼
近期会话上下文              Dreaming 后台任务
（较快可用）                （异步综合）
                                 │
                                 ▼
                         更新长期用户画像
                                 │
                                 ▼
                         后续新会话使用
```

**[官方]** 后台综合、新旧事实更新和对时间变化的处理已经确认。

**[推断]** 上图各环节的具体存储服务、刷新周期和调度关系并没有公开。

### 2.3 Dreaming 会挑选什么？

根据当前长期画像及社区实验，比较容易被吸收的内容包括：

| 内容 | 典型表现 |
|---|---|
| 稳定事实 | 工作背景、常用技术栈 |
| 长期偏好 | 喜欢哪种讲解方式、排斥哪些做法 |
| 持续项目 | 项目目标、架构、关键决策 |
| 重复讨论的主题 | 一段时间内持续关注的研究方向 |
| 当前状态 | 正在执行的计划、尚未解决的问题 |
| 明确纠正 | 不再使用的方案、更新后的目标 |

但这并不是一张已经公开的选择规则表。

没有可靠证据表明 Dreaming 使用“出现三次就存储”之类的固定阈值。

从最终画像可以看出，它不只是保存单个事实，而是会把跨会话讨论综合成更高层级的状态描述。

例如多次讨论 Personal Agent 的权限边界之后，长期画像可能形成一个包含“用户想实现什么、有哪些安全限制、还有什么待定问题”的主题。

### 2.4 Dreaming 如何更新记忆？

OpenAI 公开的目标包括三类：

1. 保留相关、长期有价值的事实。
2. 更新错误、相互矛盾或过时的信息。
3. 根据时间推进调整记忆状态。

例如：

```text
旧状态：
用户计划在 2026 年 7 月出差。

新状态：
用户曾计划在 2026 年 7 月出差。
```

这里系统只应该调整计划的时间状态，而不能凭空认定出差已经发生。

社区还观察到，长期画像的更新不一定紧跟用户消息。

Shlok 曾连续观察数天，发现画像在一段时间内不变，之后才发生更新。

这说明**至少部分长期画像更新是异步的，而不是每条消息触发一次完整重写**。

### 2.5 到底是 Patch、Merge 还是全量重写？

这一点尚未还原。

能够观察到的是：新旧信息会被综合，长期画像可能变化，而且多个事实能合并为一段新描述。

一种合理的行为等价模型是：

```python
def dreaming(old_profile, historical_evidence, now):
    new_profile = synthesize(
        previous=old_profile,
        evidence=historical_evidence,
        current_time=now,
        goals=[
            "保留长期有价值的信息",
            "吸收新的事实",
            "修正矛盾或过时信息",
            "合并重复主题",
            "降低低价值细节的权重"
        ]
    )
    return new_profile
```

但这不代表实际生产实现一定使用单次 LLM 调用，也不代表它每次读取全部历史。

目前无法可靠确认：

- Dreaming 的定时或事件触发策略。
- 是否有逐 Thread 预处理层。
- 是全量重写还是主题级增量更新。
- 冲突解决与去重算法。
- 长期画像的硬性 Token 预算。
- 是否具有独立版本控制或回滚机制。

**Memory Summary 的修改也不等于立即重写底层画像。**

一个合理的解释是：用户的纠正先成为新的证据，影响当前及近期上下文，随后再由 Dreaming 综合进长期画像。

但“纠正最终一定被纳入”尚不能保证。社区曾观察到旧事实残留、重复记忆和细节丢失等问题。

---

## 三、消费方式

目前最关键的发现是：**ChatGPT 的记忆消费不是纯 RAG，而是预加载上下文与按需历史检索并存。**

### 3.1 常驻上下文：模型回复前就获得记忆

当前实例能够直接读取 `User Knowledge Memories`、`Recent Conversation Content` 和 `User Interaction Metadata`。

因此，一次新聊天的模型输入可以抽象为：

```text
[运行指令与其他上下文]
...

# User Knowledge Memories

Inferred from past conversations with the user -
these represent factual and contextual knowledge
about the user ...

1. COMMUNICATION PREFERENCES
- ...

2. HARDWARE / ENVIRONMENT
- ...

3. SOFTWARE / TOOLING
- ...

4. KEY TECH PROJECTS
- ...

...

11. MODEL / PROVIDER
- ...

# Recent Conversation Content

Users recent ChatGPT conversations,
including timestamps, titles, and messages.

User messages are delimited by ||||.
Assistant messages are delimited by ::::.

1. [日期与时间] [会话标题]:
||||用户消息
||||用户消息

2. [日期与时间] [会话标题]:
<<conversation too long; truncated>>
||||用户消息片段

...

# User Interaction Metadata

Auto-generated from ChatGPT request activity.
Reflects usage patterns, but may be imprecise
and not user-provided.

1. User's account is ...
2. User's average conversation depth is ...
3. User's local hour is ...
...

[当前 Thread 的消息]
...
```

这是按实际可见结构重建的**记忆上下文片段**，不是 ChatGPT 完整 System Prompt，也不表示这些区块在所有请求中始终以完全相同的顺序出现。

尤其需要注意，`User Knowledge Memories` 中包含多个可能与当前问题无关的主题。

这表明至少在观察到的实例中，**不是每次只检索与当前问题最相关的几条记忆再注入**。

模型能够利用这些已加载的内容直接完成个性化回答。

例如：

> 我之前做的多 Agent 项目，任务系统有什么核心设计？

由于长期画像已经包含项目及任务体系信息，模型可以不额外搜索历史，直接给出概括性回答。

这种方式的优点是：

- 不需要每个问题都执行记忆检索。
- 模型天然拥有较完整的用户背景。
- 能支持用户没有明确要求“调用记忆”的个性化需求。

缺点则是：

- 预加载会消耗上下文。
- 压缩画像可能缺少精确细节。
- 陈旧记忆可能干扰生成。
- 模型需要在上下文中自行判断哪些记忆相关。

这里还存在一个未经确认的问题：生产系统是否会根据模型、套餐、请求长度或用户状态，动态裁剪这些预加载内容。目前观察到的是实际提供的快照，不能证明所有记忆永远完整常驻。

### 3.2 按需历史检索：找回长期画像没有保存的细节

2026 年 1 月 15 日，OpenAI 正式宣布 ChatGPT 能更可靠地查找过去聊天中的具体细节。

因此，2025 年早期“ChatGPT 无法主动搜索历史聊天”的逆向结论已经不适用于当前系统。

**当前 ChatGPT 实例拥有独立的个人上下文检索入口。**

#### 具体调用参数

一次真实调用使用了以下形式：

```python
personal_context.search({
    "query": (
        "The user is writing a technical article "
        "on ChatGPT Memory. Retrieve their past "
        "discussions in September 2026 about "
        "Jev computer-use-skill, especially "
        "MiniWoB++ 9/9 experiments, cost and "
        "execution-time reductions, with "
        "provenance type and timestamps."
    )
})
```

这是当前 ChatGPT 实例提供的内部工具调用形式，**不是公开、稳定的开发者 API**。

调用者目前可见的参数如下：

| 参数 | 类型 | 作用 |
|---|---|---|
| `query` | string | 使用自然语言描述所需的个人历史信息 |

值得注意的是：

- 没有显式提供 `top_k`。
- 没有独立的 `start_date`、`end_date` 参数。
- 没有直接传入 `thread_id` 的参数。
- 没有要求传入向量 Embedding。
- 时间、目标主题、来源约束都可以写进 `query` 文本。

而且该接口要求查询尽量自包含。例如不能只依赖“找出刚才说的那个实验”，而应该把具体项目、时间范围、所需数据写清楚。

这意味着在 LLM 调用层，ChatGPT 的历史检索被封装成**自然语言语义查询接口**，而不是向模型直接暴露数据库查询能力。

但无法据此判断后台是否使用了独立的关键词过滤、向量相似度排序或混合召回。

#### 实际返回格式

本次查询返回了以下内容。为便于阅读，仅摘录相关部分，保持原有标记和时间戳：

```text
[convo search]

- [PRIOR_ASSISTANT_OUTPUT] [c0]
  A@2026-09-24T07:14:06Z, -33d:
  MiniWoB++：9/9，
  成本较历史 Native 降52.7%、
  耗时降38.5%；
  lookup/research类公开网页任务：4/4，
  成本降7.9%、耗时增12.3%。

- [USER_FACT] [c1]
  U@2026-09-22T02:24:43Z, 1mo 6d:
  Jev is a fast zero-shot multiple-choice
  text model used to choose UI actions
  for Codex computer use;
  user seeks text-only/low-vision Mac benchmarks.

- [PRIOR_ASSISTANT_OUTPUT] [c3]
  A@2026-09-29T08:15:37Z, -29d:
  Hermes PR:
  Jev default recall 75.5%
  vs production 78.9%.

...

[gmail]
[INSUFFICIENT] No matching Gmail emails found.

[files]
Sources:
[f0] NOOA_and_Memory.md
...
[INSUFFICIENT] No retrieved file provides
the requested September 2026 Jev results.
```

原始结果中还存在其他命中的会话片段，上面以 `...` 明确标注了本文省略部分。

这次检索返回了一些长期画像没有保存的细节，例如：

- MiniWoB++：9/9，成本降低 52.7%，耗时降低 38.5%。
- 其他网页任务：4/4，成本降低 7.9%，耗时反而增加 12.3%。
- Jev 与 Hermes Memory 的历史对比结果。

其中某些内容属于过去 Assistant 的陈述，因此**返回成功不等于实验数据已经被独立验证**。

#### 返回字段分析

| 标记 | 解释 |
|---|---|
| `[convo search]` | 历史聊天检索分区 |
| `[USER_FACT]` | 从用户历史陈述提取的事实 |
| `[USER_PREFERENCE]` | 从历史中提取的用户偏好，可能在其他查询出现 |
| `[PRIOR_ASSISTANT_OUTPUT]` | 过去助手输出过的信息 |
| `[c0]`、`[c1]` | 当前结果内的会话分组标识 |
| `U@...` | 用户消息及 UTC 时间 |
| `A@...` | Assistant 输出及 UTC 时间 |
| `-33d`、`1mo 6d` | 相对时间描述 |
| `[gmail]` | 邮件来源检索分区 |
| `[files]` | 文件来源检索分区 |
| `[INSUFFICIENT]` | 未找到足够相关的证据 |

特别需要指出两个容易误读的地方。

**第一，返回内容往往是摘要片段，不是聊天原文。**

例如 `[USER_FACT]` 的内容可能已经被规范化、翻译或压缩。不能因为它带有用户来源标签，就认为该文本是用户当时逐字说过的话。

同样，`[PRIOR_ASSISTANT_OUTPUT]` 只是历史助手输出的内容，可能包含未经验证的结论。

**第二，`c0` 和 `c1` 不是稳定 Thread ID。**

在两次同主题检索实验中，同一个历史会话的分组编号发生过变化。

因此它们更像当前结果集中的局部标识，不能直接作为跨请求引用 Thread 的稳定键。

检索结果也会携带绝对和相对时间。部分结果的相对时间表达存在不一致，因此精确分析时更应该依赖绝对 UTC 时间戳。

#### 历史检索究竟搜索了什么？

目前能够确认：

1. 可以跨多个历史会话进行语义检索。
2. 能定位过去特定时间的用户事实和 Assistant 输出。
3. 结果带有来源类别和时间信息。
4. 可以检索长期画像未保存的细节。
5. 返回结果可能经过摘要和语义整理。
6. 个人上下文检索还可能涉及文件、邮件等其他已连接来源。

但是，无法确认检索底层到底是以下哪种方案：

```text
A. 原始聊天消息
   → 分块
   → 向量/关键词检索
   → 结果整理

B. 历史 Thread
   → 预生成摘要
   → 摘要检索
   → 结果返回

C. 历史 Thread
   → 用户事实/事件抽取
   → 结构化索引
   → 检索

D. 混合方案
   → 多类索引召回
   → 排序/整理
   → 返回片段
```

虽然返回内容出现了 `USER_FACT`、`PRIOR_ASSISTANT_OUTPUT` 等标记，但这不足以判断标记是在写入索引时生成，还是在检索后整理结果时生成。

同样，也不能因为返回的是摘要，就推断后台没有保存原始聊天。

### 3.3 两种消费路径如何配合？

现在可以将 ChatGPT 的消费行为整理为一段逻辑伪代码：

```python
def chat(user_message, current_thread):
    # 预加载的个性化背景
    context = [
        user_knowledge_memories,
        recent_conversation_content,
        user_interaction_metadata,
        current_thread,
    ]

    # 当历史细节可能改善回答时，
    # 模型可以发起独立的检索
    if need_precise_historical_context(
        user_message, context
    ):
        query = make_self_contained_query(
            user_message, current_thread
        )
        results = personal_context.search({
            "query": query
        })
        context.append(results)

    return generate_answer(context)
```

以上是**行为等价模型**，不是 ChatGPT 内部生产代码。

其中，`need_precise_historical_context` 的实际判断方式、查询改写过程及底层排序算法，都还没有得到公开验证。

不过，已经能够区分三个消费层级：

| 层级 | 主要问题 | 使用方式 |
|---|---|---|
| 长期画像 | 用户是谁？有哪些长期目标和约束？ | 预加载 |
| 近期会话 | 用户最近在讨论什么、纠正了什么？ | 预加载 |
| 历史检索 | 过去某次讨论具体发生了什么？ | 按需调用 |

例如：

**“继续设计我的 Personal Agent。”**

长期画像可能已经足够让模型知道 PA 的定位、授权边界与核心设计方向。

**“上个月我对 PA 授权边界究竟做过哪些修改？”**

这个问题要求精确的历史变更，可能需要检索多个 Thread 并比较当时的讨论记录。

这两类问题对 Memory 的要求完全不同，所以 ChatGPT 并没有只依靠一个通用的 RAG 流程处理它们。

---

总体来看，2026 年 ChatGPT Chat 的 Memory 可以概括为：

**原始历史提供证据，Dreaming 生成长期综合状态，近期会话维持短期连续性，模型预加载这些背景，并在需要细节时主动检索历史。**

其中，长期画像已经能观察到相当具体的文本格式与内容层级；历史检索也能观察到明确的调用参数和带来源标记的返回格式。

目前最主要的未知部分仍然是两项：

**其一，Dreaming 怎样选择、整合、纠正和淘汰长期信息。**

**其二，历史检索底层如何建立索引、组织检索单位和执行召回排序。**

除此之外，“ChatGPT 如何在不同时间尺度上消费用户历史”已经可以构建一套有实际证据支撑的工作模型，而不必依赖专利描述或纯粹猜测。

### 主要参考资料

1. OpenAI，2026-06-04：[Dreaming: Better memory for a more helpful ChatGPT](https://openai.com/index/chatgpt-memory-dreaming/)
2. OpenAI：[ChatGPT Release Notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)，特别是 2026-01-15 和 2026-06-04。
3. OpenAI：[Memory in ChatGPT](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)
4. Shlok Khemani，2026-06-06：[ChatGPT's Memory Update Has a Packaging Problem](https://www.shloked.com/chatgpt-memory-2026)
5. Shlok Khemani，2025：[ChatGPT Memory and the Bitter Lesson](https://www.shloked.com/chatgpt-memory)
6. Johann Rehberger，2025-05-04：[How ChatGPT Remembers You: A Deep Dive into Its Memory and Chat History Features](https://embracethered.com/blog/posts/2025/chatgpt-how-does-chat-history-memory-preferences-work/)

*本文中的长期画像、近期会话与历史检索示例来自同一 ChatGPT 实例的实际观察。为方便公开展示，对部分个人信息进行了省略；任何省略均已标注。*

