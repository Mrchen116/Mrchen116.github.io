---
title: "Mem0：Agent 长期记忆是怎么工作的"
excerpt: "拆解 Mem0 如何从 interaction 中提取、存储与检索长期记忆，以及 Harness 与记忆中间层的边界。"
---

Mem0 可以理解成一个 **Agent 的长期记忆中间层**：

> 把历史 interaction 转成可检索的 semantic memory，在未来任务里按需找回来。

它不是完整的 Agent Harness。
Harness 决定 **什么时候写、什么时候读、读出来以后怎么用**；Mem0 主要负责 **提取、存储和检索 Memory**。

一句话：

> **Mem0 把 Agent 的 interaction 经过一次 LLM extraction，变成可长期检索的自然语言 Memory Records。Harness 控制何时 `add()`、何时 `search()`。**

---

## 1. 整体流程

[![Mem0 从对话提取 Memory Record、建立多路索引，再检索并交还 Harness 使用的完整流程](/assets/articles/how-mem0-agent-memory-works/overview.png)](/assets/articles/how-mem0-agent-memory-works/overview.png)

```text
Harness
   │
   │ mem0.add(new_messages)
   ▼
┌────────────────────────────┐
│           Mem0             │
│                            │
│  收集 extraction context   │
│           ↓                │
│  Memory Extractor LLM      │
│           ↓                │
│  Memory Records            │
│           ↓                │
│  Vector / BM25 / Entity    │
└─────────────┬──────────────┘
              │
         mem0.search()
              ▼
       Relevant Memories
              │
              ▼
          Harness
              ↓
           Agent
```

---

## 2. `add()`：Memory 怎么产生

Harness 调：

```python
mem0.add(
    messages=[
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
    ],
    user_id="jack"
)
```

### Extractor 的输入

当前 V3 pipeline 会准备三块信息：

```text
① New Messages
   本次 add() 传入的 user / assistant messages

② Last Messages
   同一 session/scope 最近 10 条历史消息

③ Existing Memories
   用 New Messages 做 query，
   从已有 Memory 中向量检索 Top 10
```

```text
                 New Messages
                 /          \
                /            \
               ▼              ▼
最近 10 条历史消息       Vector Search Top 10
               \              /
                \            /
                 ▼          ▼
                Extractor LLM
```

作用：

```text
Last Messages
→ 解决局部上下文和指代
→ “第二个”“上面那个方案”

Existing Memories
→ 查重
→ 判断与哪些历史 Memory 有关联
```

---

## 3. Extractor 的 Prompt 在做什么

核心 prompt 可以压缩成：

```text
你是一个 Memory Extractor。

INPUT:

New Messages:
    本轮新 interaction

Last Messages:
    最近历史消息，用于理解上下文和指代

Existing Memories:
    相关已有 memories，用于查重和建立关联

Observation Date:
    当前时间


TASK:

从 USER 消息提取未来可能有用的信息：

- 用户事实、偏好、观点
- 项目背景和状态
- 决策
- 计划 / 意图
- 经历 / 事件
- 状态变化及原因
- 用户提供材料中的重要事实

从 ASSISTANT 消息也可提取：

- recommendation
- plan
- research conclusion
- solution
- 双方形成的 agreement

要求：

1. 多个 topic 拆成多条 memory
2. 每条 memory 自包含
3. 消除“它 / 第二个 / 上面的方案”等指代
4. 相对时间尽量转换成具体时间
5. 保留名字、数字、型号、原因等细节
6. 已有的相同信息跳过
7. 状态变化时保留变化关系
8. 与旧 memory 有明显关系时记录关联
9. 无值得保存的信息则返回空数组


OUTPUT:

{
  "memory": [
    {
      "text": "...",
      "attributed_to": "user",
      "linked_memory_ids": [...]
    }
  ]
}
```

例如：

```text
Existing Memory:
Project Alpha currently uses Redis.

Last Messages:
User: Redis 最近一致性问题很多。
Assistant: 可以考虑 PostgreSQL。

New Messages:
User:
“嗯，还是换第二个吧，以后这个项目统一用它。”
```

Extractor 会解析：

```text
第二个 = PostgreSQL
它 = PostgreSQL
这个项目 = Project Alpha
```

生成：

```text
User switched Project Alpha from Redis to PostgreSQL
after experiencing consistency issues with Redis.
```

这里一次完成：

```text
事实提取
+ 指代消解
+ 上下文补全
+ 原因保留
+ 状态变化表达
```

---

## 4. Memory 最终存成什么

核心是一条自然语言 Semantic Memory：

```json
{
  "id": "mem_123",
  "memory": "User switched Project Alpha from Redis to PostgreSQL after experiencing consistency issues.",
  "user_id": "jack",
  "created_at": "...",
  "metadata": {}
}
```

Memory 尽量：

```text
self-contained
context-rich
脱离原 conversation 也能理解
适合未来 retrieval
```

当前自动 extraction 偏历史追加：

```text
M1:
User chose Redis.

M2:
Redis caused consistency issues.

M3:
User switched from Redis to PostgreSQL.
```

因此可以保留决策和状态的变化过程。

---

## 5. Memory 入库后怎么建索引

```text
                    Memory Text
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
      Embedding         BM25           Entity
         │               │               │
   Semantic Search   Keyword Search   Entity Boost
```

### Vector

Memory text 做 embedding，未来按照语义相似度召回。

### BM25

关键词检索，对下面这类内容尤其有价值：

```text
Project Alpha
M153
PostgreSQL
nano-multiagent
```

### Entity

生成 Memory Record 后，再做一次轻量实体抽取。

```text
User switched Project Alpha from Redis to PostgreSQL.
```

抽出：

```text
Project Alpha
Redis
PostgreSQL
```

当前 OSS 主要使用：

```text
spaCy + 人工规则
```

spaCy 中的 **NER（Named Entity Recognition）** 可以简单理解为一个训练好的文本模型：

```text
“马斯克在特斯拉工作”
          ↓
         NER
          ↓
马斯克 → PERSON
特斯拉 → ORG
```

即从文本里圈出人名、公司、地点、产品等实体，并判断类型。

之后规则层补漏、过滤和归一化：

```text
NER / noun chunks
        ↓
候选实体
        ↓
规则处理
├─ 补漏
├─ 过滤泛词
├─ 去掉日期 / 数字等噪声
├─ 识别引号术语 / identifier
└─ 去重、归一化
        ↓
最终 Entities
```

---

## 6. Entity Store

抽完 Entity 后建立：

```text
Entity → Memory IDs
```

例如：

```text
Project Alpha
   ├── M1
   ├── M5
   └── M12

PostgreSQL
   ├── M5
   └── M20
```

本质是一个 **实体到 Memory 的倒排索引**。

---

## 7. `search()` 怎么检索

```python
mem0.search(
    query="Project Alpha database decision",
    user_id="jack"
)
```

检索链路：

```text
Query
 │
 ├─ Vector similarity
 ├─ BM25
 └─ Entity matching
 │
 ▼
Score Fusion
 │
 ▼
Top-K Memories
```

Entity matching 例如：

```text
Query 出现 Project Alpha
        ↓
查 Entity Store
        ↓
找到 M1 / M5 / M12
        ↓
这些 Memory 获得额外 boost
```

这就是 `entity-assisted retrieval`。

---

## 8. 适合什么应用场景

Mem0 最匹配这类问题：

> **大量 interaction 跨 session 积累，其中一些历史信息未来会有用，但无法提前知道什么时候会用到。**

典型场景：

```text
Personal Assistant
→ 用户偏好、个人背景、过去计划和经历

Customer / Sales Agent
→ 客户诉求、历史沟通、之前的决定和承诺

长期项目 / Research Agent
→ 历史方案、调查结论、决策变化、踩坑经历

Coding Agent
→ 过去试过什么方案、为什么失败、以前排查到哪里
```

Coding Agent 这块社区没有很强共识。

一派倾向使用 Mem0 这类 semantic retrieval memory，解决跨 session 的历史经验召回。

另一派直接使用：

```text
Markdown / SQLite / append-only event log
```

认为更简单、可控，也足够好。

所以 Mem0 最有优势的是这种信息：

```text
“我们以前聊过 / 试过 / 决定过，
现在可能相关，但它没有固定位置应该被加载。”
```

如果信息属于实时状态、确定性规则或固定文档知识，通常有更直接的数据源。

---

## 9. Harness 和 Mem0 的边界

```text
Harness
│
├── 什么时候 add()
├── 什么时候 search()
├── search 用什么 query
└── Memory 怎么放入 Agent Context


Mem0
│
├── Interaction + Context
│        ↓
├── Extractor LLM
│        ↓
├── Semantic Memory
│        ↓
├── Vector / BM25 / Entity Index
│        ↓
└── Relevant Memories
```

整个 Mem0 主线：

```text
New Interaction
       +
Recent Messages
       +
Relevant Old Memories
       ↓
Memory Extractor LLM
       ↓
Self-contained Memory Records
       ↓
Vector + BM25 + Entity Index
       ↓
Future Retrieval
```

> **Mem0 的核心工作：把 noisy interaction 提炼成稳定的 Semantic Memory，再建立多路索引，供未来 Agent 按需召回。**
