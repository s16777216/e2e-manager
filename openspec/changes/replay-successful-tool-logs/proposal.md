## Why

為了解決 AI Agent 在推導 E2E 測試步驟時，每次重複執行相同步驟都會產生高昂的 LLM Token 成本與時間開銷。在畫面結構無變動的前提下，相同的步驟理應執行相同的操作動作。因此，透過重放上一次成功的工具執行紀錄，可以在保證測試可靠性的同時，大幅降低 Token 消耗並加速測試的執行。

## What Changes

- **新增工具重放機制 (Replay Mode)**：在 `executorNode` 執行測試步驟時，若全域啟用重放且該步驟於先前的執行中已有相同測試案例版本（`testcaseVersion`）之成功（`passed`）紀錄，系統將自動重放上一次成功的工具執行紀錄（`TestLog`），不呼叫 LLM Executor Model。
- **測試案例版本驅動失效 (Version Invalidation)**：於 `Testcase` 引入 TypeORM `@VersionColumn`，並於 `TestRun` 記錄執行時的 `testcaseVersion`。當測試案例之提示詞、步驟或變數更新時，版本自動遞增，舊有軌跡自動失效並平滑回退至 LLM 重新推導。
- **整合動作即驗證與自我修復 (Self-healing)**：在重放模式下，若因為畫面變動、ID 偏移等因素導致 Playwright 工具執行回傳失敗字串、超時（縮短至 2000ms 以加速反應）或拋出異常，系統將自動中斷重放，拋棄當前步驟之重放暫存日誌，保留瀏覽器現場，重設單步重試次數，無縫切換回一般的 **Agent 推導模式** 重新觀察網頁並推導出正確的工具調用。
- **全域重放開關與逃生閥**：於 `SystemSetting` 中新增 `enableReplay`（預設為 `true`），並於前端「系統設定」頁面提供開關切換。
- **免除 Selector 翻譯與 Mapping 邏輯**：利用 DOM 結構不變時 JS 注入產生 ID 具有決定性（Deterministic）的特性，在重放執行 ID 相關工具前自動確保 `observeWebPage()` 刷新 DOM 標籤，直接以相同的 ID 執行重放。

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `ts-step-by-step-runner`：修改此規格，在步驟執行流程中引入 Replay 重放與 Self-healing 自我修復機制。
- `system-settings`：新增 `enableReplay` 全域開關設定與前端介面切換。
- `testcase-management`：引入測試案例實體版本號（`version`）自動遞增機制。

## Impact

- **後端資料庫 (DB)**：
  - `Testcase` 實體新增 `@VersionColumn({ default: 1 }) version!: number`。
  - `TestRun` 實體新增 `@Column("integer", { default: 1 }) testcaseVersion!: number`。
  - `SystemSetting` 實體新增 `@Column("boolean", { default: true }) enableReplay!: boolean`。
- **後端執行核心 (`backend/src/graph.ts`)**：
  - 調整 `executorNode`，在執行前檢查 `enableReplay` 與版本命中，若命中則執行重放。
  - 實作字串失敗檢查、2000ms 快速超時判定與拋棄暫存日誌後交棒 LLM 之修復邏輯。
- **前端介面 (`frontend/src/views/SettingsView.tsx`)**：
  - 新增「啟用歷史軌跡重放」Switch 開關並與 API 對接。
