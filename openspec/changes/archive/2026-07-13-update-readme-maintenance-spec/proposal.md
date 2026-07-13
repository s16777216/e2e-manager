# Proposal: Update README for Internal Maintenance Specification

## Summary
更新專案根目錄的 `README.md`，將其定位從過時的通用介紹調整為**團隊內部維護規格書**。更新內容包含最新系統架構圖（納入 Model Management、Playwright `observe_web_page` 數字標籤定位、Structured Failure Summarizer 與 Hono/PostgreSQL SSE 串流），並詳細說明各核心子系統的維護指南與資料庫 Entity 關係。

## Motivation
目前專案的 README.md 主要反映早期架構，與現有程式碼庫存在顯著 Gap：
1. **獨立模型管理 (Model Management)**：系統現已支援 Executor / Asserter / Failure Summarizer 多模型獨立配置（Google Gemini, OpenAI, Local LLM），但 README 未有記錄。
2. **網頁感知與動作工具 (Playwright Element Labeling)**：後端自研了 `observe_web_page` 數字 ID 標籤注入與帶貼紙截圖機制，非外部框架。
3. **失敗結構化診斷 (Failure Summarizer)**：測試失敗時自動調用獨立 Summarizer 模型產出結構化診斷 JSON (`FailureSummarySchema`)。
4. **前端 Bento IDE 與視覺體驗**：前端使用了 Bento Layout、樹狀測試目錄、線上步驟編輯 (Inline Edit) 以及 ImagePreview 放大縮放檢視器。

為了提升團隊開發人員維護專案、追蹤資料流與擴充功能的效率，需要一份精準且完整的內部維護規格書。

## Proposed Changes
修改 `README.md`，主要包含以下結構：
1. **專案概述與架構目標**：定義專案架構定位與技術棧（Hono, LangGraph, Playwright, PostgreSQL, Bento UI）。
2. **全局系統架構與資料流**：提供最新的 ASCII 全局架構與資料流轉圖。
3. **核心子系統維護指南**：
   - 事務性 DB Queue 排隊與防搶鎖機制 (`FOR UPDATE SKIP LOCKED`)
   - LangGraph 狀態機與 Playwright 數字 ID 標籤定位工具 (`observe_web_page`, `click`, `input` 等)
   - 多模型動態調度 (`llmFactory`, `modelService`) 與 Failure Summarizer
   - PostgreSQL `LISTEN/NOTIFY` 與 Hono SSE 即時串流實現
   - 前端 Bento IDE 模組 (Tree View, Resizable Panels, Inline Editor, ImagePreview)
4. **資料庫 Schema 與 Entity 關係**：記錄各主要 Entity (Project, Group, Testcase, TestRun, TestLog, ModelSetting) 與動態變數注入機制。
5. **本地開發與 Operations 指引**：環境變數與 Docker 部署細節。
6. **OpenSpec 規格變更規範**：如何使用 OpenSpec 管理專案變更。

## Capabilities Affected
- `README.md`（文件更新，不影響程式碼執行邏輯）
