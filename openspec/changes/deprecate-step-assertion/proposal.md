## Why

現有系統為了解決非同步加載與步驟正確性，在每個步驟執行完畢並呼叫 `done_acting` 後，會進入一個獨立的 `step_asserterNode`。此節點會使用多模態 LLM 比對當前網頁截圖是否符合該步驟的預期結果（`stepExpected`）。
然而，這種設計存在以下技術痛點：
1. **費用高昂**：每個步驟皆要額外呼叫一次 LLM 進行視覺分析判定。
2. **速度緩慢**：測試需要等待斷言模型回應，導致執行效率極低。
3. **競爭條件（Race Condition）**：由於 AJAX / Toast 的非同步性質，工具執行完成與 Asserter 截圖之間存在時間差，當 Toast 消失後截圖常因「文字未出現」而引發大量誤判與測試失敗。

藉由在動作工具（如 `click`、`key`）中導入 `waitStrategy`（等待特定文字或頁面導航）與全域等待工具，Executor 本身已能在執行動作時直接對預期結果進行等待與隱式驗證。因此，獨立的 `step_asserterNode` 已屬冗餘，應予廢棄。

## What Changes

- **BREAKING**: 廢棄 LangGraph 狀態機中的獨立步驟斷言節點 `step_asserterNode`，並移除 `asserter_model` 的相關調用。
- 簡化 LangGraph 狀態機的路由邏輯，當步驟執行完畢並呼叫 `done_acting` 後，直接將步驟標記為 `passed` 並進入 `step_trackerNode` 推進下一個步驟。
- 更新 Executor 的 System Prompt，教導並規定其若步驟有設定 `stepExpected` 或是需要非同步等待時，必須在發送點擊/按鍵等動作時指定 `waitStrategy` 與 `expectedText`，或利用等待工具確保畫面載入完成後才呼叫 `done_acting`。

## Capabilities

### New Capabilities
- `deprecate-step-assertion`: 廢棄獨立的步驟級視覺斷言，將斷言與等待邏輯合流至 Executor 的工具鏈中。

### Modified Capabilities
<!-- 無 -->

## Impact

- `backend/src/graph.ts`: 移除 `step_asserterNode`，修改 `routeAfterExecution` 路由邏輯，當呼叫 `done_acting` 時不再跳轉至 `step_asserter` 而是直接推進步驟；更新 `buildExecutorSystemPrompt` 引導規則。
- `backend/src/graph/router.ts`: 移除 `routeAfterStepAssertion` 路由方法。
- `backend/src/graph/prompt.ts`: 更新系統 Prompt 規則，要求模型在 `done_acting` 前必須確保透過工具完成預期的頁面加載或特定文字等待。
