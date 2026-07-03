## Why

目前系統的環境變數（Project / Group / Testcase 層級）只支援靜態常數值，每次測試執行時插值結果完全相同。當測試需要唯一識別符（避免帳號名稱衝突）、當前時間（驗證頁面顯示的日期）或隨機數值時，測試人員只能在步驟文字中手動寫死，失去靈活性與可維護性。

## What Changes

- 在插值引擎中新增**JS 表達式沙箱** `{{expression}}` 的解析與執行能力，使用 Node.js 的 `vm` 模組執行
- 沙箱內可存取常用的內建 JavaScript 物件（`Math`, `Date`, `JSON`, `crypto` 等）及目前已合併的靜態變數（如 `username`）
- 支援**命名快照 (Named Snapshot)**：藉由 `$vars` Proxy，利用 JS 原生 `??=` 語法，例如 `{{$vars.account_id ??= crypto.randomUUID()}}`，同一個 TestRun 中相同 snapshotKey 只計算一次並快取，後續呼叫返回相同值
- 當 JS 表達式執行出錯（語法錯誤、執行期錯誤、超時）時，系統會丟出 Exception，中斷目前步驟的執行並回報錯誤
- JS 表達式插值點與靜態變數相同：step action、step expected、initCookies、initLocalStorage

## Capabilities

### New Capabilities

- `builtin-dynamic-variables`: 插值引擎支援 JS 表達式沙箱求值與命名快照快取，整合 Node.js `vm` 模組

### Modified Capabilities

- `project-variables-persistence`: 現有靜態變數的插值行為不變，但 `interpolateString` / `interpolateObject` 的函式簽名需擴展以傳入 `RunContext`（向下相容，現有呼叫不受影響）

## Impact

- **後端** `backend/src/services/environmentService.ts`：擴展 `interpolateString` 與 `interpolateObject`，引入 `vm` 模組進行 JS 表達式沙箱執行
- **後端** `backend/src/queue.ts`：在 `executeJob` 中建立 `RunContext` 並傳遞給所有插值呼叫，捕獲插值拋出的 Exception 以終止步驟執行
- **前端**：不需要改動核心邏輯；可選擇性更新 `VariablesEditor.tsx` 的說明文字，提示使用者可輸入 JS 表達式語法
