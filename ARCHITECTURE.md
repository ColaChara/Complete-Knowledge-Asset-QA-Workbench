# Knowledge Asset QA Workbench — Architecture

> Analysis of TASK.md requirements, distilled into system architecture, data flow, retrieval strategy, state management, and an implementation roadmap.

---

## 1. System Architecture

### High-Level Design

The application is a **fully client-side** single-page application built on Next.js 15 App Router. There is no backend server, no database, and no API routes — all logic runs in the browser. localStorage acts as the persistence layer.

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │  Left Panel   │  │         Right Panel               │  │
│  │  (Assets)     │  │      (Agent Workspace)            │  │
│  │               │  │                                   │  │
│  │  AssetList    │  │  AgentChat  ───  AnswerPanel     │  │
│  │  ├──AssetCard │  │                 ├──CitationList  │  │
│  │  └──AssetForm │  │                 └──TracePanel    │  │
│  │               │  │                                   │  │
│  └──────────────┘  └──────────────────────────────────┘  │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────────┐│
│  │                    Lib Layer                          ││
│  │  storage.ts ──── retrieval.ts ──── answer-generator.ts││
│  │                                                       ││
│  │  ↑ localStorage (window)       ↑ pure functions       ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Layers

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **UI (Components)** | Render assets, chat, trace, citations. Handle loading/empty/error states. | React + Tailwind + shadcn/ui |
| **Hooks / State** | Bridge between UI and lib layer. Read from localStorage, call retrieval, manage chat history. | React hooks (`useState`, custom hooks) |
| **Lib (Pure Logic)** | All business logic: CRUD operations, keyword retrieval, answer generation. Zero React imports. | Plain TypeScript modules |
| **Persistence** | Store and retrieve KnowledgeAssets. | `localStorage` via `storage.ts` |
| **Types** | Shared TypeScript interfaces. | `knowledge.ts` |

### Key Architectural Decisions

1. **No API routes** — everything happens client-side. This keeps deployment trivial (static export) and avoids unnecessary network latency for a local RAG simulation.
2. **Pure lib layer** — `retrieval.ts` and `answer-generator.ts` are pure functions with no React dependency. This makes them unit-testable and framework-agnostic.
3. **Component colocation by domain** — asset components live together, agent components live together. No mixing.

---

## 2. Folder Structure

```
src/
├── app/
│   ├── globals.css              # Tailwind imports + minimal global styles
│   ├── layout.tsx               # Root layout (fonts, metadata)
│   └── page.tsx                 # Main page — two-panel layout, NO business logic
│
├── components/
│   ├── assets/
│   │   ├── asset-list.tsx        # Scrollable list of asset cards
│   │   ├── asset-card.tsx        # Single asset card (title, tags, preview, time)
│   │   └── asset-form.tsx        # Create new asset form
│   │
│   └── agent/
│       ├── agent-chat.tsx        # Question input + send + orchestration
│       ├── answer-panel.tsx      # Final answer display
│       ├── citation-list.tsx     # References linking back to assets
│       └── trace-panel.tsx       # Step-by-step agent reasoning trace
│
├── lib/
│   ├── storage.ts               # localStorage CRUD (getAssets, saveAsset, deleteAsset)
│   ├── retrieval.ts             # Keyword-based ranking engine (pure function)
│   └── answer-generator.ts      # Generate answer from retrieved results (pure function)
│
├── hooks/
│   └── use-assets.ts            # Custom hook: read/write assets from localStorage
│   └── use-agent.ts             # Custom hook: manage chat state, retrieval, answer flow
│
├── types/
│   └── knowledge.ts             # KnowledgeAsset, SearchResult, ChatMessage, etc.
│
└── data/
    └── seed.ts                  # Initial 12 knowledge assets (platform, knowledge base, workflow, RAG, security, etc.)
```

### Rationale

- **`components/assets/` and `components/agent/`** — separates two distinct domains of the app. Easier to navigate than a flat list.
- **`hooks/`** — extracts stateful logic from components. Components become presentation-only.
- **`lib/`** — pure functions with zero framework dependency. Maximum testability.
- **`data/seed.ts`** — seed data lives in its own file so it's easy to modify or extend.

---

## 3. Data Flow

### 3.1 Creating a Knowledge Asset

```
User fills AssetForm
        │
        ▼
onSubmit(title, content, tags)
        │
        ▼
useAssets.addAsset({ id: cuid(), title, content, tags, createdAt: ISO })
        │
        ▼
storage.ts: saveAsset(asset) → localStorage.setItem('knowledge-assets', JSON.stringify([...assets, asset]))
        │
        ▼
useAssets updates internal state → AssetList re-renders immediately
```

### 3.2 Agent QA Flow (Core RAG Loop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User types question                                                    │
│      │                                                                  │
│      ▼                                                                  │
│  1. agent-chat.tsx captures question                                    │
│      │                                                                  │
│      ▼                                                                  │
│  2. TRACE STEP 1: "Retrieval"                                           │
│     retrieval.search(query, assets) → SearchResult[]                    │
│       - Tokenizes query into keywords                                   │
│       - Scores each asset: titleMatch*5 + tagMatch*3 + contentMatch*1   │
│       - Returns top 3 results sorted by score descending                │
│      │                                                                  │
│      ▼                                                                  │
│  3. TRACE STEP 2: "Ranking"                                             │
│     Results sorted, displayed with scores in trace panel                │
│      │                                                                  │
│      ▼                                                                  │
│  4. TRACE STEP 3: "Answer Generation"                                   │
│     answer-generator.generate(question, SearchResult[]) → Answer        │
│       - Concatenates retrieved snippets as context                      │
│       - Uses template-based generation:                                 │
│         "Based on [Asset1], [Asset2], [Asset3]..."                      │
│         → Summarizes key points from retrieved content                  │
│       - Associates citations (asset IDs → titles)                       │
│      │                                                                  │
│      ▼                                                                  │
│  5. Results rendered:                                                   │
│     AnswerPanel: generated answer text                                  │
│     CitationList: clickable source references                           │
│     TracePanel: full step breakdown with scores                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow Diagram

```
┌─────────────┐     ┌────────────┐     ┌─────────────┐
│  AssetForm   │────▶│            │     │  AssetList  │
└─────────────┘     │ useAssets  │◀────└─────────────┘
                    │ (hook)     │
┌─────────────┐     │            │     ┌─────────────┐
│  Storage.ts │◀───▶│            │     │  AssetCard  │
└─────────────┘     └────────────┘     └─────────────┘

┌──────────────┐    ┌───────────┐    ┌──────────────────┐
│  AgentChat   │───▶│ useAgent  │───▶│  retrieval.ts    │
└──────────────┘    │ (hook)    │    └────────┬─────────┘
                    │           │             │
┌──────────────┐    │           │    ┌────────▼─────────┐
│  AnswerPanel │◀───│           │    │answer-generator.ts│
└──────────────┘    └───────────┘    └──────────────────┘
                                            
┌──────────────┐    ┌───────────┐
│ CitationList │◀───│ Answer    │
└──────────────┘    └───────────┘

┌──────────────┐
│ TracePanel   │◀── useAgent.trace
└──────────────┘
```

---

## 4. Retrieval Strategy

### Keyword-Based Ranking Engine

The retrieval engine is intentionally simple (no vector DB) but structured for future upgrade.

#### Algorithm

```
function search(query: string, assets: KnowledgeAsset[]): SearchResult[]
```

1. **Normalize** — lowercase both query and asset fields.
2. **Tokenize** — split query into words, filter stop words (optional for simplicity).
3. **Score each asset** using weighted term frequency:

```
score = (titleKeywordMatches   × 5)  +
        (tagKeywordMatches     × 3)  +
        (contentKeywordMatches × 1)

where keywordMatch = number of distinct query tokens that appear in the field
```

4. **Sort** by score descending.
5. **Return** top 3 results with:
   - `assetId`
   - `title`
   - `snippet` (first ~150 chars of content + ellipsis)
   - `score`

#### Why This Scoring Scheme

| Weight | Field | Rationale |
|--------|-------|-----------|
| ×5 | **title** | Title match is strongest relevance signal |
| ×3 | **tags** | Tag overlap signals topical relevance |
| ×1 | **content** | Content matches are weakest — broad but low precision |

This mimics TF-IDF intuition without the complexity. Title and tags act as "dense" signals; content provides breadth.

#### Snippet Generation

```
snippet = truncate(content, 150 chars)
          + "..." if truncated
```

No highlight logic in v1 — keep it simple.

#### Future: Vector Database Integration

To upgrade from keyword to semantic search:

1. **Document** → Each KnowledgeAsset content is a document to embed.
2. **Embedding** → Use an embedding model (e.g., `text-embedding-3-small`, `all-MiniLM-L6-v2`) to convert each document into a vector.
3. **Vector Store** → Store vectors in a vector DB (pgvector, Pinecone, Weaviate, Chroma).
4. **Similarity Search** → Embed the query, perform cosine similarity search against stored vectors.
5. **TopK Context** → Retrieve top K most similar documents as context for answer generation.

The `retrieval.ts` interface (`search(query, assets) → SearchResult[]`) is designed so a vector-powered implementation can swap in without changing the rest of the system.

---

## 5. State Management Strategy

### Approach: React Hooks + localStorage Sync

No state management library. The app's state is simple enough for `useState` + custom hooks.

### State Breakdown

```
Global State (via hooks)
├── assets: KnowledgeAsset[]      — All knowledge assets (from localStorage)
│   └── Managed by useAssets hook
│
└── chat: ChatState               — Current agent session
    ├── question: string
    ├── trace: Trace | null       — { steps: [{name, status, data}] }
    ├── answer: Answer | null     — { text, citations: Citation[] }
    └── loading: boolean          — Is agent processing?
    └── Managed by useAgent hook
```

### Data Flow Rules

1. **Unidirectional** — UI triggers actions (submit question, create asset). Actions call lib functions. Results flow back through hooks to UI.
2. **Single source of truth** — localStorage is the authoritative store. The `useAssets` hook reads from localStorage on mount and writes on every mutation.
3. **Immediate UI update** — On asset creation, the hook updates state optimistically (before localStorage write completes). On retrieval, results are set in state as each step completes.

### Hook Design

```typescript
// use-assets.ts
function useAssets() {
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // On mount: read from localStorage via storage.ts
  // addAsset(title, content, tags): save to localStorage, update state
  // removeAsset(id): remove from localStorage, update state
  
  return { assets, loading, addAsset, removeAsset };
}

// use-agent.ts
function useAgent() {
  const [chat, setChat] = useState<ChatState>(initialChatState);
  
  // ask(question, assets): run retrieval → ranking → generation pipeline
  //   Updates trace step by step
  //   Sets answer at the end
  // reset(): clear chat state
  
  return { chat, ask, reset };
}
```

### Why Not useContext / Redux / Zustand?

- **Too few consumers** — `assets` is consumed only by asset components. `chat` is consumed only by agent components. No shared state between the two panels.
- **No deep component tree** — max 2 levels of nesting. Prop drilling is not a problem.
- **Avoid unnecessary deps** — requirement explicitly says "Do NOT add unnecessary dependencies."

---

## 6. Implementation Roadmap

### Overview

4-hour time budget. The order prioritizes **vertical slices** — each step produces something visible and testable.

### Phase 0: Project Scaffolding (30 min)

- [ ] Initialize Next.js 15 project with TypeScript + Tailwind + App Router
- [ ] Install and configure shadcn/ui (add components: Card, Badge, Separator, ScrollArea, Skeleton, Button, Input, Textarea)
- [ ] Define types in `src/types/knowledge.ts`
- [ ] Create seed data in `src/data/seed.ts`
- [ ] Implement `src/lib/storage.ts` (getAssets, saveAsset, removeAsset, seedIfEmpty)
- [ ] Set up `src/app/globals.css` with Tailwind + minimal design tokens
- [ ] Create root layout (`layout.tsx`) with fonts and metadata

**Deliverable**: App boots with empty two-panel layout.

### Phase 1: Knowledge Asset Management (45 min)

- [ ] Implement `useAssets` hook
- [ ] Build `AssetCard` component (title, tags, content preview, created time)
- [ ] Build `AssetList` component (ScrollArea wrapper, loading skeleton, empty state)
- [ ] Build `AssetForm` component (title + content + tags fields, validation, submit)
- [ ] Wire up left panel in `page.tsx`

**Deliverable**: Left panel shows seed assets, supports creating new assets, updates immediately.

### Phase 2: Retrieval Engine (30 min)

- [ ] Implement `src/lib/retrieval.ts` — `search(query, assets) → SearchResult[]`
  - Tokenizer, scorer, sorter, snippet generator
  - Pure function, no side effects
- [ ] Write a quick manual test (console.log in dev) verifying scoring weights

**Deliverable**: Retrieval utility ready. Can call `search("AIOS enterprise")` and get ranked results.

### Phase 3: Agent QA & Trace (60 min)

- [ ] Implement `src/lib/answer-generator.ts` — `generate(question, results) → Answer`
  - Template-based: "Based on [title], [title]..." + summary from content snippets
  - Attach citations (asset ID → title mapping)
- [ ] Implement `useAgent` hook — orchestrates retrieval → ranking → generation
- [ ] Build `AgentChat` component — text input + send button + loading state
- [ ] Build `AnswerPanel` component — displays generated answer
- [ ] Build `CitationList` component — displays references with anchor links to asset cards
- [ ] Build `TracePanel` component — step-by-step trace (Retrieval → Ranking → Generation)
  - Show actual retrieved asset names and scores
  - Animated step indicators (optional, restrained)
- [ ] Wire up right panel in `page.tsx`

**Deliverable**: Full RAG loop works. User asks a question, sees trace, gets answer with citations.

### Phase 4: Polish & README (45 min)

- [ ] Visual polish:
  - Two-panel responsive layout (left ~40%, right ~60%)
  - Hover states on cards and citations
  - Loading skeletons for asset list and answer panel
  - Empty states (no assets yet, no questions yet)
  - Consistent spacing, typography, color
- [ ] Self-review: remove dead code, console.log, unused imports
- [ ] Write `README.md` per TASK.md spec (architecture decisions, how retrieval works, vector DB integration, multi-tenancy, production concerns)

**Deliverable**: Ship-ready application.

### Phase 5: Verification (remaining time)

- [ ] `npm run build` passes with zero errors
- [ ] Lint clean
- [ ] Manual walkthrough: create asset → ask question → verify trace → verify citations → verify empty states

---

## Appendix: Component Interface Specifications

### AssetCard Props

```typescript
interface AssetCardProps {
  asset: KnowledgeAsset;
  isSelected?: boolean;
  onClick?: (id: string) => void;
}
```

### SearchResult (retrieval.ts output)

```typescript
interface SearchResult {
  assetId: string;
  title: string;
  snippet: string;
  score: number;
}
```

### Answer (answer-generator.ts output)

```typescript
interface Answer {
  text: string;
  citations: Citation[];
}

interface Citation {
  assetId: string;
  title: string;
}
```

### Trace (useAgent internal state)

```typescript
interface AgentTrace {
  steps: TraceStep[];
}

interface TraceStep {
  name: 'retrieval' | 'ranking' | 'generation';
  status: 'pending' | 'running' | 'completed' | 'error';
  data?: {
    query?: string;
    results?: SearchResult[];
    scores?: Record<string, number>;
    answer?: string;
  };
}
```

### Storage Interface

```typescript
// storage.ts
const STORAGE_KEY = 'knowledge-assets';

function getAssets(): KnowledgeAsset[];
function saveAsset(asset: KnowledgeAsset): void;
function removeAsset(id: string): void;
function seedIfEmpty(): void;  // writes seed data if localStorage is empty
```

---

## Non-Functional Requirements Checklist

| Requirement | How Achieved |
|------------|-------------|
| Strict TypeScript | `strict: true` in tsconfig, no `any`, no `@ts-ignore` |
| Reusable components | Components receive data via props, no implicit dependencies |
| Clean naming | camelCase for vars/functions, PascalCase for types/components |
| No dead code | Remove unused imports, variables, and functions before completing |
| No console.log | Search for `console.log` at the end and remove |
| No excessive colors | Use Tailwind's gray/slate/zinc palette, one accent color |
| Loading states | Skeleton components during asset load and answer generation |
| Empty states | Dedicated UI when no assets exist or no questions asked |
| Enterprise feel | Clean typography, generous whitespace, restrained design |
