## Why

目前專案主規格目錄 `openspec/specs/` 下存在多達 32 個分散的目錄。有些目錄是以過往的變更名稱命名（例如 `deprecate-final-visual-assertion`），有些則是新舊重複（例如 `step-by-step-runner` 與 `ts-step-by-step-runner`）或 UI 元件過度破碎。這導致規格難以閱讀、搜尋，且失去了作為「專案當前規格真理來源（Single Source of Truth）」的維護價值。因此需要進行一次系統性的主規格重構與合併。

## What Changes

- 將 32 個破碎的主規格目錄整合成 7 大核心能力模組。
- 將新舊重複的規格（例如 JS 與 TS 版本）進行去重與統一。
- 將過往屬於「變更（Changes）」或「修補（Deprecations）」的規格內容，重新梳理並歸併入對應的系統核心能力規格中。
- 補齊許多規格文件中原本為 `TBD` 的 Purpose 與 Purpose 背景說明。
- 刪除已整合的 30 個舊有規格目錄，維護乾淨 of `openspec/specs/` 目錄結構。

## Capabilities

### New Capabilities
- `e2e-runner`: 端到端執行核心，包含步驟佇列、Gemini 決策、Replay 重放模式、視覺感知等。
- `task-queue`: 任務佇列與調度，包含背景執行器、任務容器、全域執行歷史記錄等。
- `reporting-and-assertion`: 測試報告與單步/最終斷言。
- `web-dashboard`: 前端 Web 儀表板 UI，包含樹狀資料表格、時間軸、麵包屑、Lucide 動畫代理等。
- `infrastructure`: 專案基礎設施，包括 Docker 部署與單元測試規範等。

### Modified Capabilities
- `testcase-management`: 劇本與變數管理，整合動態變數、專案變數持久化、專案視圖等。
- `system-settings`: 系統配置，整合設定驗證與截圖保留規則等。

## Impact

- 僅影響 `openspec/specs/` 及其目錄結構，不影響實際產品程式碼（`backend/`、`frontend/` 等）。
- 有利於未來 AI 代理在讀取系統規格時能更精確、快速地理解系統的核心能力，避免因為規格破碎而產生混淆。
