## Why

現有系統在所有 E2E 測試步驟執行完畢後，會進入最終全局預期結果驗證節點（`asserterNode`），調用 LLM 對照 `testcase.expected` 判定最終畫面是否符合預期。然而，許多測試案例的預期結果（例如 Toast 提示訊息、暫態提示框等）具有暫態性質，在測試步驟完整跑完時通常已經消失，進而導致高頻率的誤判與測試失敗。我們已經在單步層級實作了 `step_asserter` 即時進行斷言，因此全局視覺斷言已屬冗餘，應予廢棄。

## What Changes

- 廢棄全局 `asserterNode` 中呼叫 LLM 對照 `testcase.expected` 進行判定之邏輯。
- 調整 `asserterNode` 行為，在所有測試步驟執行與單步驗證通過後，直接將 `TestRun` 的狀態標記為 `passed` (PASS)，且說明理由為「所有測試步驟均已成功執行完畢。」，並關閉瀏覽器。
- 減少不必要的 LLM token 消耗與 API 呼叫，提升測試執行速度。

## Capabilities

### New Capabilities
- `deprecate-final-visual-assertion`: 廢棄測試層級的最終視覺預期結果判定，將成功判定點提前至所有步驟之單步驗證皆順利完成。

### Modified Capabilities
<!-- 無 -->

## Impact

- `backend/src/graph.ts`: 修改 `asserterNode` 實作，移除 LLM 判定及 tokens 統計逻辑，改為自動標記 `PASS` 與關閉瀏覽器。
