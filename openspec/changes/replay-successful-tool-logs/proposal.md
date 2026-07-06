## Why

為了解決 AI Agent 在推導 E2E 測試步驟時，每次重複執行相同步驟都會產生高昂的 LLM Token 成本與時間開銷。在畫面結構無變動的前提下，相同的步驟理應執行相同的操作動作。因此，透過重放上一次成功的工具執行紀錄，可以在保證測試可靠性的同時，大幅降低 Token 消耗並加速測試的執行。

## What Changes

- **新增工具重放機制 (Replay Mode)**：在 `executorNode` 執行測試步驟時，若該步驟於先前的執行中已成功完成（`passed`），系統將自動重放上一次成功的工具執行紀錄（`TestLog`），不呼叫 LLM Executor Model。
- **整合動作即驗證與自我修復 (Self-healing)**：在重放模式下，若因為畫面變動、ID 偏移等因素導致 Playwright 執行工具或等待預期文字時拋出 Timeout 等異常，系統將自動中斷重放並切換回一般的 **Agent 推導模式**，重新使用 LLM 觀察網頁並推導出正確的工具調用，更新成功紀錄以修復後續執行。
- **免除 Selector 翻譯與 Mapping 邏輯**：利用 DOM 結構不變時 JS 注入產生 ID 具有決定性（Deterministic）的特性，直接以相同的 ID 執行重放。若發生偏移則交由「動作即驗證」的異常捕獲機制與 Agent 自我修復來把關。

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `ts-step-by-step-runner`：修改此規格，在步驟執行流程中引入 Replay 重放與 Self-healing 自我修復機制。

## Impact

- **`backend/src/graph.ts`**：調整 `executorNode`，在執行前檢查有無上一次 passed 的日誌軌跡，若有則執行重放。若重放過程中拋出異常，則捕獲並 fallback 到一般 LLM 推理。
- **資料庫 (DB)**：無 schema 異動，直接讀取現有的 `TestLog` 及 `TestRunStep` 資料表來實現重放參考。
