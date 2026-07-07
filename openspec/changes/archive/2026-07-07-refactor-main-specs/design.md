## Context

目前 `openspec/specs` 目錄下共有 32 個規格資料夾，大部分是過往變更封存（Archive）時直接以變更名稱（如 `deprecate-step-assertion`）生成的，結構非常破碎。這會導致未來 AI 代理在讀取系統規格進行程式開發時，面臨脈絡混淆、資訊分散與理解效率低下的問題。

## Goals / Non-Goals

**Goals:**
- 將現有 32 個破碎的規格資料夾整合成 7 大核心能力模組，與專案的後端（`backend`）、前端（`frontend`）和基礎設施（Docker/Unit Tests）架構對應。
- 完整保留所有重要的 Requirement 與 Scenario 條目，無損合併，並去除 JS/TS 重複遺留。
- 補齊規格檔案中原為 `TBD` 的 Purpose 背景目的說明。
- 刪除已整合的 30 個舊有規格資料夾，維護乾淨的 `openspec/specs/` 目錄結構。

**Non-Goals:**
- 此變更為純規格文件的重構，不對專案任何實際產品程式碼（`backend`、`frontend`）進行調整。

## Decisions

### Decision 1: 整合成 7 大領域能力模組
我們將規格重組為以下模組：
1. `e2e-runner`: 步驟調度、Gemini 決策、Replay 重放與視覺感知。
2. `task-queue`: PostgreSQL 背景佇列與任務狀態調度。
3. `testcase-management`: 劇本 CRUD、動態與專案變數、視圖管理。
4. `reporting-and-assertion`: 單步與最終視覺斷言、執行日誌與報告生成。
5. `web-dashboard`: 前端 Web SPA（React/Vite）的所有 UI 元件與時間軸。
6. `system-settings`: 系統設定、設定驗證、截圖保留策略。
7. `infrastructure`: Docker 部署配置與單元測試規範。

### Decision 2: 處理遺留與重複規格
- 廢棄舊版的 `step-by-step-runner` 與 `step-assertion-and-reporting`，以 TypeScript 新版規格為底本，合併重組為 `e2e-runner` 與 `reporting-and-assertion`。
- 將 `deprecate-*` 系列的特殊修改規格，直接融入執行器和斷言器的 Requirements 描述中，不再作為獨立的 Capability 存在。

## Risks / Trade-offs

- **[Risk]** 在重構與合併過程中遺漏原有的重要測試情境（Scenario）。
  - *Mitigation*: 逐一檢視所有 32 個 spec 檔案，並在 Delta Specs 中將其完整搬移，隨後以手動核對確保所有需求點都被完整覆蓋。
