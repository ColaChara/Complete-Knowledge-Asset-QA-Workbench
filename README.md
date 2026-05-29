# Knowledge Asset QA Workbench

轻量级企业级 RAG（检索增强生成）系统模拟。用户可通过自然语言对知识资产进行智能问答，系统展示完整的检索→排序→生成链路，不依赖任何外部 AI API。

---

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript (strict 模式) |
| 样式 | Tailwind CSS v4 |
| UI 组件 | shadcn/ui (base-nova 风格) |
| 图标 | lucide-react |
| 持久化 | localStorage（纯客户端，无服务端） |
| 工具库 | clsx + tailwind-merge, class-variance-authority |

强调：零外部 AI API 依赖，所有检索和答案生成均为本地纯函数实现。

---

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务
npm run dev

# 3. 浏览器打开
open http://localhost:3000
```

应用启动时自动写入 12 条种子知识资产（AIOS 平台介绍、数字资产知识库、Agent 工作流、RAG 架构、向量检索、Agent 可观测性、大模型幻觉、Prompt 注入、访问控制与权限管理、多租户架构、企业知识管理、工作流编排），可直接在 Agent Workspace 面板提问。

---

## 项目结构

```
src/
├── app/
│   ├── globals.css          # 全局样式 + Tailwind + shadcn 变量
│   ├── layout.tsx           # 根布局（字体、元信息）
│   └── page.tsx             # 主页面 — 双面板布局，不含业务逻辑
│
├── components/
│   ├── assets/
│   │   ├── asset-card.tsx    # 知识资产卡片（标题、标签、预览、时间）
│   │   ├── asset-list.tsx    # 可滚动资产列表（空状态）
│   │   └── asset-form.tsx    # 创建资产弹窗表单
│   │
│   ├── agent/
│   │   ├── agent-chat.tsx    # 问答输入框 + 发送按钮
│   │   ├── answer-panel.tsx  # 答案展示（加载骨架屏、空状态）
│   │   ├── citation-list.tsx # 引用列表（点击跳转源资产）
│   │   └── trace-panel.tsx   # Agent 推理过程追踪面板
│   │
│   └── ui/                   # shadcn/ui 组件（Card, Badge, Dialog 等）
│
├── hooks/
│   ├── use-assets.ts         # 资产状态管理（localStorage CRUD）
│   └── use-agent.ts          # Agent 流程编排（检索→排序→生成）
│
├── lib/
│   ├── storage.ts            # localStorage 持久化层
│   ├── retrieval.ts          # 关键词检索引擎（纯函数）
│   ├── answer-generator.ts   # 答案生成器（纯函数）
│   └── utils.ts              # 通用工具（cn, truncate）
│
├── types/
│   └── knowledge.ts          # 所有 TypeScript 类型定义
│
└── data/
    └── seed.ts               # 12 条种子数据（覆盖平台、知识库、工作流、RAG、安全等多领域）
```

### 分层原则

- **UI 层**（`components/`）— 纯展示组件，通过 props 接收数据，不直接访问 localStorage 或业务逻辑
- **Hooks 层**（`hooks/`）— 状态管理 + 业务编排，连接 UI 与 lib 层
- **Lib 层**（`lib/`）— 纯 TypeScript 函数，零 React 依赖，可独立单元测试
- **Types 层**（`types/`）— 共享类型定义，单点修改

---

## 架构决策

### 为什么全客户端？

任务明确要求"不添加数据库、不添加认证"。选择全客户端架构：

- **部署简化** — 可静态导出（`next export`），任意静态服务器即可托管
- **零延迟检索** — 所有数据在内存中，搜索无网络开销
- **数据完全本地** — 无隐私合规问题，适合 demo 场景

**代价**：数据不可持久化跨设备、存储上限受浏览器限制（~5MB）、无服务端渲染 SEO。

### 为什么纯函数 Lib 层？

`retrieval.ts` 和 `answer-generator.ts` 不导入任何 React 模块：

- 可用 Node.js 直接运行单元测试
- 可切换至 Web Worker 执行（减轻主线程压力）
- 后续替换为真实向量检索时接口不变

### 为什么 useAgent 用 async 编排？

trace 面板需要展示 Retrieval → Ranking → Generation 三个步骤的递进状态。通过 `yieldToReact()`（`setTimeout(0)`）让 React 在每一步之间渲染中间态，用户能看到检索→排序→生成的完整链路，而非一闪而过的黑盒。

---

## 数据模型

```typescript
interface KnowledgeAsset {
  id: string;           // 唯一标识
  title: string;        // 资产标题
  content: string;      // 正文内容
  tags: string[];       // 标签数组
  createdAt: string;    // ISO 8601 创建时间
}
```

存储方式：序列化为 JSON 存入 `localStorage`，key 为 `knowledge-assets`。

### 种子数据

应用首次加载时自动写入 12 条知识资产，覆盖以下领域：

| 领域 | 条目数 |
|---|---|
| 平台介绍 | AIOS 平台介绍 |
| 知识管理 | 数字资产知识库、企业知识管理 |
| Agent 机制 | Agent 工作流、Agent 可观测性 |
| 检索技术 | RAG 架构、向量检索 |
| 安全 | 大模型幻觉、Prompt 注入、访问控制与权限管理 |
| 架构 | 多租户架构、工作流编排 |

---

## 检索实现

### 关键词排名算法

```
score = titleMatchCount × 5 + tagMatchCount × 3 + contentMatchCount × 1
```

| 权重 | 字段 | 原因 |
|---|---|---|
| ×5 | title（标题） | 标题匹配是最高相关性信号 |
| ×3 | tags（标签） | 标签重叠指示主题相关性 |
| ×1 | content（内容） | 内容匹配最宽泛，精度低 |

**流程**：
1. **标准化** — 查询和字段统一小写
2. **分词** — 按空白字符拆分查询词
3. **匹配计数** — 对每个资产统计各字段的匹配词数
4. **加权求和** — 按权重公式计算总分
5. **排序截取** — 降序排列，返回 Top 3

### 检索结果结构

```typescript
interface SearchResult {
  assetId: string;      // 资产 ID
  title: string;        // 资产标题
  snippet: string;      // 内容摘要（~150 字符）
  score: number;        // 匹配分数
}
```

### 答案生成

当检索结果为 0 时，返回无结果提示。有结果时：

1. 从资产原文中提取与问题最相关的句子（同关键词匹配算法）
2. 拼接为上下文文本
3. 生成模板化答案："基于 [资产A]、[资产B] 的检索结果……"
4. 关联引用（assetId → title 映射）

---

## 向量数据库集成方案

如果要从关键词检索升级为语义检索，推荐以下路径：

```
文档 → Embedding → 向量存储 → 相似度搜索 → TopK 上下文
```

### 各环节说明

| 步骤 | 说明 | 可选技术 |
|---|---|---|
| **文档（Document）** | 每个 KnowledgeAsset 的 content 字段作为待嵌入文档 | — |
| **Embedding（向量化）** | 用嵌入模型将文档转换为固定维度向量 | `text-embedding-3-small`（OpenAI）、`all-MiniLM-L6-v2`（开源）、`BGE`（国产开源） |
| **向量存储（Vector Store）** | 存储向量并支持近似最近邻（ANN）搜索 | pgvector（PostgreSQL 插件）、Pinecone、Weaviate、Chroma、Qdrant |
| **相似度搜索（Similarity Search）** | 对用户查询做同样嵌入，计算与所有文档向量的余弦相似度 | 各向量数据库内置 |
| **TopK 上下文（TopK Context）** | 取相似度最高的 K 条结果作为答案生成的上下文 | K 通常为 3-5 |

### 接口兼容

当前 `retrieval.ts` 的接口签名：

```typescript
search(query: string, assets: KnowledgeAsset[]): SearchResult[]
```

替换为向量检索后，实现变为：

```typescript
async function search(query: string, assets: KnowledgeAsset[]): Promise<SearchResult[]> {
  const queryEmbedding = await embed(query);
  const results = await vectorStore.similaritySearch(queryEmbedding, 3);
  return results.map(r => ({
    assetId: r.metadata.assetId,
    title: r.metadata.title,
    snippet: r.pageContent.slice(0, 150),
    score: r.similarity,
  }));
}
```

调用方（`use-agent.ts`）无需任何修改，保证架构的可替换性。

---

## 多租户支持方案

当前版本为单用户设计。如果要支持多租户：

### 数据隔离层

```typescript
interface KnowledgeAsset {
  id: string;
  tenantId: string;       // ★ 新增：租户标识
  workspaceId?: string;   // ★ 新增：工作区标识（可选嵌套）
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}
```

### 存储改造

```typescript
// 按 tenantId 分 key 存储
const storageKey = (tenantId: string) => `knowledge-assets:${tenantId}`;
```

或全量存储 + 查询时过滤（数据量 < 1000 条时可行）：

```typescript
function getAssetsByTenant(tenantId: string): KnowledgeAsset[] {
  return getAllAssets().filter(a => a.tenantId === tenantId);
}
```

### 权限模型

```
用户 → 角色（RBAC）→ 权限
├── 管理员：跨租户读写
├── 编辑者：本租户读写
└── 查看者：本租户只读
```

### 路由设计

```
/{tenantId}/knowledge-assets
/{tenantId}/agent
```

在 layout 层解析 `tenantId`，注入 hooks 作为参数，所有数据访问自动限定作用域。

### 生产注意事项

- 多租户必须使用服务端数据库（替代 localStorage），否则租户间无隔离
- 考虑 Connection Pool 按租户隔离，防止一个租户的慢查询影响其他租户
- 审计日志需要包含 tenantId 字段

---

## 生产部署（ToB）的核心关注点

### 1. 幻觉（Hallucination）

**风险**：答案生成可能编造不存在的事实。

**缓解措施**：
- 强制答案必须引用检索原文，无法引用时明确告知"未找到相关信息"
- 每个答案附带引用列表（当前已实现）
- 引入事实性校验层（后续可用 NLI 模型验证答案与检索原文的一致性）
- 设置置信度阈值，低于阈值时拒绝回答

### 2. 检索质量（Retrieval Quality）

**风险**：检索不到相关内容 → 答案无意义。

**缓解措施**：
- 混合检索策略：关键词（当前） + 向量语义检索 + 重排序（cross-encoder）
- 评估指标：Hit Rate、MRR（Mean Reciprocal Rank）、NDCG
- 建立 golden dataset（问题 + 期望检索结果），CI 中自动回归
- 支持检索结果的手动反馈标注

### 3. 访问控制（Access Control）

**风险**：用户看到不该看到的知识资产。

**缓解措施**：
- 文档级权限（每个 asset 标注可见范围）
- 所有检索查询必须携带用户上下文
- 检索结果返回前过滤不可见资产
- 审计日志记录每一次检索操作

### 4. Prompt 注入（Prompt Injection）

**风险**：用户通过恶意输入操纵系统行为。

**缓解措施**：
- 输入清洗：去除控制字符、过长输入截断
- 答案生成中严格区分"用户输入"和"检索原文"的边界
- 不将用户输入直接拼入系统指令
- 输出校验：检查答案是否包含不应出现的模式

### 5. 可观测性（Observability）

**风险**：生产问题无法排查。

**缓解措施**：
- Agent Trace 机制可扩展为结构化日志（每条检索请求记录 query、results、score、latency）
- 关键指标：检索延迟 P50/P99、无结果率、用户反馈率
- 集成 OpenTelemetry：检索链路作为 span，嵌入耗时、token 消耗
- 慢检索告警（当前为纯内存检索，但切换到向量DB后网络延迟是关键）

---

## 权衡与取舍

| 决策 | 好处 | 代价 |
|---|---|---|
| 全客户端（localStorage） | 零部署成本、零延迟 | 数据不跨设备、存储上限 5MB |
| 关键词检索（无向量） | 零外部依赖、立即运行 | 同义词/语义匹配缺失 |
| 模板答案生成（无 LLM） | 确定性、无 API 成本 | 答案不够自然灵活 |
| 纯函数 Lib 层 | 可测试、可替换 | 无状态，需调用方管理数据 |
| 无状态管理库 | 减少依赖、体积小 | 复杂状态需自行管理 |

---

## 后续改进方向

- [ ] **单元测试** — 为 retrieval、answer-generator、storage 编写测试（Vitest 或 Jest）
- [ ] **Web Worker 检索** — 大量资产场景下避免主线程阻塞
- [ ] **检索结果高亮** — 在 snippet 中标记匹配关键词
- [ ] **数据导出/导入** — 种子数据 JSON 导出，便于备份和迁移
- [ ] **暗色模式** — shadcn 已内置 dark 变量，切换开关即可
- [ ] **键盘快捷键** — `Cmd+K` 聚焦搜索，`Cmd+N` 新建资产
- [x] **资产编辑** — 支持创建、编辑、删除完整 CRUD
- [ ] **检索调试面板** — 展示每个资产的详细打分（title/tag/content 各自得分）
