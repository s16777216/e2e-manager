# Design: Internal Maintenance Specification README Refactoring

## Architecture & Data Flow Diagram

以下為重構後 README.md 將採用的最新系統架構與資料流轉圖：

```
                              ┌──────────────────────────────────────────────┐
                              │    前端網頁儀表板 (Nginx + React Bento IDE)   │
                              │    - 樹狀目錄結構 / 線上步驟編輯 (Inline Edit)│
                              │    - Image Preview 檢視器 / SSE 即時日誌視窗 │
                              └──────────────────────────────────────────────┘
                                   │ :3001 (所有流量統一入口)       ▲
                                   ├── 靜態頁面 (Nginx 直回)        │
                                   └── /api/* (反向代理至後端) ─────┘
                                                 │                  ▲
                                     RESTful APIs│                  │ Server-Sent Events (SSE)
                           1. 設定模型/觸發 Run  ▼                  │ (即時串流步驟日誌、截圖與失敗診斷)
                              ┌──────────────────────────────────────────────┐
                              │             Hono Web API Server              │
                              │        - 訂閱 DB NOTIFY (LISTEN 連線)        │
                              └──────────────────────────────────────────────┘
                                   │                                │
                       2. 讀取/設定│                                │ 3. 寫入 Pending 佇列
                       模型與變數  ▼                                ▼
               ┌──────────────────────────────┐         ┌──────────────────────────────┐
               │         PostgreSQL           │         │     事務性背景佇列 (DB)      │
               │  - Scenarios / TestLogs      │         │   (FOR UPDATE SKIP LOCKED)   │
               │  - ModelSettings / Variables │         │                              │
               └──────────────────────────────┘         └──────────────────────────────┘
                            ▲      ▲                                   │
       6. 寫入 Failure      │      │                                   │ 4. 領取 Run & 解析環境變數
          Summary / Log     │      │ 5. 載入 Executor / Summarizer     ▼
          並發佈 NOTIFY ─────┤      │    Model 配置            ┌──────────────────────────────┐
                            │      └───────────────────────│       E2E Test Worker        │
                            │                              │         (LangGraph)          │
                            │                              └──────────────────────────────┘
                            │                                   │             │
                            │                                   │ 執行步驟    │ 測試斷言失敗
                            │                                   ▼             ▼
                            │                        ┌─────────────┐       ┌───────────────────────┐
                            │                        │ Executor    │       │ Failure Summarizer    │
                            │                        │ LLM Model   │       │ LLM Model             │
                            │                        └─────────────┘       │ (FailureSummarySchema)│
                            │                               │              └───────────────────────┘
                            │                     工具調用  │                         │ 生成結構化診斷
                            │                    (click/input/observe)                 └──────┐
                            │                               ▼                                │
                            │                        ┌─────────────┐                         │
                            │                        │ Playwright  │                         │
                            │                        │ Browser     │                         │
                            │                        │ Manager     │                         │
                            │                        └─────────────┘                         │
                            │                               │                                │
                            │                     帶貼紙截圖│ (observe_web_page +           │
                            │                     與元素 ID │  data-e2e-agent-id 標籤)       │
                            │                               ▼                                │
                            │                        ┌─────────────┐                         │
                            │                        │ Chromium    │                         │
                            │                        │ Page        │                         │
                            │                        └─────────────┘                         │
                            │                                                                │
                            └────────────────────────────────────────────────────────────────┘
```

## Section Structure & Detailed Mapping

### Section 1: 專案概述與架構目標
- 說明多模態 AI Agent 自動化 E2E 測試管理器的維護目標。
- 標註核心依賴版本與角色：Hono (API), LangGraph (Agent State Machine), Playwright (Browser Automation), PostgreSQL + TypeORM (Storage & Queue), React + Vite (Bento IDE Frontend)。

### Section 2: 全局系統架構與資料流
- 內嵌完整 ASCII 架構圖。
- 詳細解析 Task 狀態移轉流程：`pending` -> `running` -> (`success` | `failed` -> `Failure Summarizer`)。

### Section 3: 核心子系統維護指南
- **DB Queue**：說明 `SELECT ... FOR UPDATE SKIP LOCKED` 的事務鎖原理與重啟復原防重複領取機制。
- **Browser Tools & Labeling**：說明 `observe_web_page` 注入 `data-e2e-agent-id` 標籤與座標/文字對應的演算法原理，以及工具清單 (`navigate_to`, `click`, `input`, `key`, `hover`, `wait_for_seconds`, `done_acting`)。
- **Model Management & Summarizer**：說明 `ModelSetting` 實體、`llmFactory.ts` 針對 `google` 與 `openai` 相容 API 的載入機制，以及失敗時調用 `withStructuredOutput(FailureSummarySchema)` 的診斷流程。
- **SSE Stream**：說明 PostgreSQL `LISTEN/NOTIFY` 事件與 Hono SSE endpoint 如何無縫串流日誌與圖片。
- **Bento IDE**：說明前端 UI 模組結構 (Nested Group Data Table, Resizable Panels, Inline Step Edit, ImagePreview 放大檢視)。

### Section 4: 資料庫 Schema 與 Entity 關係
- 列出核心 Entity 關聯結構 (Project -> Group -> Testcase -> TestRun -> TestLog, ModelSetting)。
- 說明變數替換系統（`${TIMESTAMP}`, `${UUID}`, 自訂變數與環境變數）。

### Section 5: 本地開發與 Operations 指引
- 整理 `npm run dev` 單一指令啟動與分開啟動方式。
- 說明 `.env` 配置與 Docker Compose 連線 (Port 3001 Frontend/API, Port 5433 PostgreSQL)。

### Section 6: OpenSpec 變更與維護流程
- 記錄 openspec 工具的使用與規範。

## Design Decisions & Tradeoffs
- **僅採用 Markdown 文字與 ASCII Diagram**：不包含展示用圖片或 GIF，保持檔案輕量、專注於資訊密度與內部維護可讀性。
- **單一 README.md 彙整**：將架構與維護指南集中於根目錄 README.md，便於新進工程師快速 Onboarding。
