# Auto Step-by-Step E2E Test Manager

本專案為基於多模態大語言模型 (LLM Agent) 的端到端 (E2E) 自動化驗收測試管理器。使用者僅需以自然語言定義測試劇本與預期結果，系統即可調度 Playwright 進行網頁 DOM 感知標籤化、模擬用戶點擊輸入，並於步驟失敗時調用獨立診斷模型生成結構化失敗原因分析。

---

## 1. 核心技術棧 (Tech Stack)

| 層級               | 技術 / 套件                                    | 角色與用途                                                             |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- |
| **AI 流程協調**    | `@langchain/langgraph`                         | 構建具備條件路由與重試機制的非同步狀態機 (Agent FSM)                   |
| **模型管理**       | `@langchain/google-genai`, `@langchain/openai` | 支援多模型獨立配置 (Executor / Asserter / Failure Summarizer)          |
| **瀏覽器自動化**   | `playwright`                                   | 執行網頁導航、DOM 數字 ID 標籤注入 (`observe_web_page`) 與操作         |
| **Web API 服務端** | `hono`, `@hono/node-server`                    | 提供 RESTful API 與 PostgreSQL LISTEN/NOTIFY 監聽之 SSE 串流           |
| **資料庫與 ORM**   | PostgreSQL, `typeorm`                          | 儲存實體資料、管理事務性 DB Queue 與即時通知                           |
| **前端介面**       | React, Vite, Tailwind CSS, Lucide Icons        | Bento IDE 視窗設計 (Resizable Panel, Inline Step Editor, ImagePreview) |
| **部署與代理**     | Docker, Docker Compose, Nginx                  | 反向代理 API 請求並託管前端靜態資源                                    |

---

## 2. 全局系統架構與資料流 (System Architecture & Data Flows)

系統採用 **DB-based 事務性背景佇列 (DB Queue)** 與 **PostgreSQL LISTEN/NOTIFY + SSE (Server-Sent Events)** 雙核心機制：

```
                              ┌───────────────────────────────────────────────┐
                              │    前端網頁儀表板 (Nginx + React Bento IDE)   │
                              │    - 樹狀目錄結構 / 線上步驟編輯 (Inline Edit)│
                              │    - Image Preview 檢視器 / SSE 即時日誌視窗  │
                              └───────────────────────────────────────────────┘
                                   │ :3001 (所有流量統一入口)       ▲
                                   ├── 靜態頁面 (Nginx 直回)        │
                                   └── /api/* (反向代理至後端) ─────┘
                                                 │                  ▲
                                     RESTful APIs│                  │ Server-Sent Events (SSE)
                           1. 設定模型/觸發 Run  ▼                 │ (即時串流步驟日誌、截圖與失敗診斷)
                              ┌──────────────────────────────────────────────┐
                              │             Hono Web API Server              │
                              │        - 訂閱 DB NOTIFY (LISTEN 連線)        │
                              └──────────────────────────────────────────────┘
                                   │                                 │
                       2. 讀取/設定│                                 │ 3. 寫入 Pending 佇列
                       模型與變數  ▼                                ▼
               ┌──────────────────────────────┐         ┌──────────────────────────────┐
               │         PostgreSQL           │         │     事務性背景佇列 (DB)      │
               │  - Scenarios / TestLogs      │         │   (FOR UPDATE SKIP LOCKED)   │
               │  - ModelSettings / Variables │         │                              │
               └──────────────────────────────┘         └──────────────────────────────┘
                            ▲      ▲                                    │
       6. 寫入 Failure      │       │                                     │ 4. 領取 Run & 解析環境變數
          Summary / Log     │       │ 5. 載入 Executor / Summarizer       ▼
          並發佈 NOTIFY ────┤       │    Model 配置         ┌──────────────────────────────┐
                            │       └───────────────────────│       E2E Test Worker        │
                            │                               │         (LangGraph)          │
                            │                               └──────────────────────────────┘
                            │                                   │              │
                            │                                   │ 執行步驟     │ 測試斷言失敗
                            │                                   ▼             ▼
                            │                        ┌─────────────┐       ┌───────────────────────┐
                            │                        │ Executor    │       │ Failure Summarizer    │
                            │                        │ LLM Model   │       │ LLM Model             │
                            │                        └─────────────┘       │ (FailureSummarySchema)│
                            │                               │              └───────────────────────┘
                            │                     工具調用  │                              │ 生成結構化診斷
                            │                    (click/input/observe)                     │
                            │                               ▼                             │
                            │                        ┌─────────────┐                       │
                            │                        │ Playwright  │                       │
                            │                        │ Browser     │                       │
                            │                        │ Manager     │                       │
                            │                        └─────────────┘                       │
                            │                               │                              │
                            │                     帶貼紙截圖│ (observe_web_page +          │
                            │                     與元素 ID │  data-e2e-agent-id 標籤)     │
                            │                               ▼                             │
                            │                        ┌─────────────┐                       │
                            │                        │ Chromium    │                       │
                            │                        │ Page        │                       │
                            │                        └─────────────┘                       │
                            │                                                              │
                            └──────────────────────────────────────────────────────────────┘
```

### 2.1 任務生命週期 (Task Lifecycle FSM)

```
 [ Pending ] ──(Worker SELECT FOR UPDATE)──> [ Running ] ───┬──> [ Success ]
                                                            │
                                                            └──> [ Failed ] ──(Failure Summarizer)──> [ Failure Summary Generated ]
```

---

## 3. 核心子系統維護指南 (Subsystems Guide)

### 3.1 事務性背景佇列 (DB Task Queue)

- **維護位置**：`backend/src/queue/` & `backend/src/queue.ts`
- **運作原理**：Worker 定期執行 `SELECT ... FOR UPDATE SKIP LOCKED` 查詢，將處於 `pending` 的 `TestRun` 鎖定並更新狀態為 `running`。
- **維護特點**：
  - 多個 Worker 可並行搶占任務而不會重複執行。
  - 若伺服器或 Worker 異常重啟，可藉由數據庫鎖自動釋放或進行超時搶佔復原。

### 3.2 瀏覽器驅動與 DOM 感知標籤 (Playwright Labeling Engine)

- **維護位置**：`backend/src/browser.ts` & `backend/src/tools.ts`
- **感知機制 (`observe_web_page`)**：
  - 自動於頁面上可互動元素注入 `data-e2e-agent-id="N"` 屬性標籤。
  - 擷取元素類型、顯示文字與 HTML 結構清單，並繪製帶數字 ID 貼紙的實時畫面截圖傳遞給 Executor LLM。
- **8 大 LangChain 工具**：
  1. `navigate_to`: 導航至特定 URL。
  2. `observe_web_page`: 重新感知的核心工具（每次操作後或頁面轉變時呼叫）。
  3. `click`: 依數字 ID 點擊元素（支援 `waitForNavigation` / `waitForText` 策略）。
  4. `input`: 依數字 ID 填入文字 (`fill`)。
  5. `key`: 模擬按鍵（如 `Enter`, `Tab`, `Escape`）。
  6. `hover`: 滑鼠懸停觸發 Tooltip 或選單。
  7. `wait_for_seconds`: 強制等待動態載入。
  8. `done_acting`: 宣告當前步驟動作完成，交由框架執行斷言。

### 3.3 多模型管理與失敗診斷 (Model Management & Failure Summarizer)

- **維護位置**：`backend/src/services/modelService.ts`, `backend/src/services/llmFactory.ts` & `backend/src/graph/prompt.ts`
- **模型分工**：
  - **Executor Model**：綁定 Playwright 工具鏈，執行步驟引導與操作。
  - **Asserter Model**：負責視覺與步驟目標斷言驗證。
  - **Summarizer Model**：當步驟斷言失敗或出現 Error 時觸發，使用 `withStructuredOutput(FailureSummarySchema)` 回傳包含 `category` (選單/選擇器/網路/邏輯)、`rootCause` 與 `suggestedFix` 的 JSON 物件。
- **供應商支援**：動態適配 Google Gemini API (`ChatGoogleGenerativeAI`) 或 OpenAI Compatible API (`ChatOpenAI` 支援自訂 `baseUrl` 與 `apiKey`，可對接 Ollama / LocalLLM)。

### 3.4 即時 Event Stream (PostgreSQL LISTEN/NOTIFY + Hono SSE)

- **維護位置**：`backend/src/routes/` & `backend/src/server.ts`
- **運作原理**：
  1. Worker 寫入 `TestLog` 時觸發 DB NOTIFY 事件。
  2. Hono 長連線服務使用 PostgreSQL `LISTEN` 訂閱對應頻道。
  3. 將日誌、截圖檔名與 Structured Failure Summary 即時以 Server-Sent Events (SSE) 串流推送到前端畫面。

### 3.5 前端 Bento IDE 介面架構

- **維護位置**：`frontend/src/`
- **核心設計模組**：
  - **樹狀結構視窗 (Tree View Data Table)**：支援無限層級嵌套群組 (`Group`) 與測試案例 (`Testcase`) 管理。
  - **Resizable Panels**：Bento 設計風格，允許用戶自由調整劇本區、即時日誌區與畫面預覽區。
  - **線上步驟編輯 (Inline Step Editor)**：支援動態步驟順序微調與變數注入。
  - **富媒體圖片預覽 (ImagePreview)**：`frontend/src/components/custom/ImagePreview.tsx` 支援圖片放大/縮放/旋轉/原圖查看與全螢幕下載。

---

## 4. 資料庫 Schema 與 Entity 關係 (Entities & DB Schema)

```
[ Project ] 1 ─── N [ Group ] (無限層級遞迴關聯 parentGroup)
    │                  │
    └─── 1 ── N ───────┴─── 1 ── N [ Testcase ]
                                        │
                                        └── 1 ── N [ TestRun ]
                                                      │
                                                      └── 1 ── N [ TestLog ]

[ ModelSetting ] ─ (鍵值/角色獨立儲存：executor / asserter / failure_summarizer)
```

### 動態變數注入系統 (Variables)

在 Testcase 步驟中可使用變數替換機制：

- **內建動態變數**：`${TIMESTAMP}` (目前時間戳記)、`${UUID}` (隨機 UUID)。
- **環境與專案變數**：由專案設定或環境設定中定義之 Key-ValuePairs 自動替換。

---

## 5. 本地開發與 Operations 指引

### 5.1 前置需求

- Node.js 18+
- Docker & Docker Compose
- Playwright Chromium 核心

### 5.2 安裝與啟動

```bash
# 1. 安裝 Monorepo 全局依賴
npm install

# 2. 安裝 Playwright 瀏覽器元件
npx playwright install chromium

# 3. 啟動開發伺服器 (同時啟動前端 Vite 與後端 Hono)
npm run dev
```

### 5.3 Docker Compose 部署

```bash
# 編排啟動所有服務 (Frontend:3001, DB:5433)
docker compose up -d --build
```

- **埠口說明**：
  - `3001`：Frontend Nginx 統一入口（靜態頁面直接回應，`/api/*` 反向代理至後端）。
  - `5433`：PostgreSQL 伺服器埠口。

---

## 6. OpenSpec 規格變更規範 (Specification Management)

專案採用 OpenSpec 進行架構演進與變更追蹤。變更規範存放於 `openspec/` 目錄：

- `openspec/specs/`：主規格定義檔。
- `openspec/changes/`：進行中與已歸檔的變更提案。

每次新增重大功能或重構架構時，請使用 OpenSpec 工作流建立 `proposal.md`、`design.md` 與 `tasks.md` 進行審查與追蹤。
