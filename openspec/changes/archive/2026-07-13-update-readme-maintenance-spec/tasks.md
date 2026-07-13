# Implementation Tasks: Update README for Internal Maintenance Specification

## Task List

- [x] 1. 重構 `README.md` 專案概述與核心技術棧清單
  - [x] 1.1 更新專案定位說明為團隊內部維護規格書
  - [x] 1.2 標註最新的技術棧（Hono, LangGraph, Playwright, PostgreSQL, Bento UI）

- [x] 2. 更新全局系統架構與資料流轉圖
  - [x] 2.1 繪製最新版 ASCII 全局架構圖（含 Model Management, Playwright DOM Labeling, Failure Summarizer, SSE）
  - [x] 2.2 補充 Task 狀態移轉生命週期說明 (`pending` -> `running` -> `success` / `failed`)

- [x] 3. 撰寫核心子系統維護指南
  - [x] 3.1 寫入 DB Queue 佇列排隊與 `FOR UPDATE SKIP LOCKED` 防鎖鎖機制
  - [x] 3.2 寫入 Playwright 網頁感知與數字 ID 貼紙標籤演算法與 8 大工具說明
  - [x] 3.3 寫入動態模型管理 (ModelSettings Service / LLM Factory) 與 Failure Summarizer 結構化診斷機制
  - [x] 3.4 寫入 PostgreSQL `LISTEN/NOTIFY` 與 Hono SSE 事件串流實現細節
  - [x] 3.5 寫入前端 Bento IDE 模組 (Tree View, Resizable Panels, Inline Step Editor, ImagePreview)

- [x] 4. 記錄資料庫 Schema 與 Entity 關係
  - [x] 4.1 整理 Project, Group, Testcase, TestRun, TestLog, ModelSetting 的 Entity 關係與欄位角色
  - [x] 4.2 記錄動態變數替換機制 (${TIMESTAMP}, ${UUID}, 自訂變數)

- [x] 5. 整理開發與 Operations 指引
  - [x] 5.1 補充 `npm run dev` 單一指令啟動與分開啟動步驟
  - [x] 5.2 整理 `.env` 變數與 Docker Compose (Port 3001 Nginx, Port 5433 Postgres) 映射資訊

- [x] 6. 驗證與格式檢查
  - [x] 6.1 檢查 README.md Markdown 語法、標籤層級與排版
  - [x] 6.2 驗證文內提及的檔案與代碼路徑正確性
