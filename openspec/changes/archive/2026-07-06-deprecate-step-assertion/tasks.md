## 1. 修改路由邏輯與狀態機重構

- [x] 1.1 修改 `backend/src/graph/router.ts` ([router.ts](file:///c:/works/e2e-manager-ts/backend/src/graph/router.ts))。簡化 `routeAfterExecution` 邏輯，當呼叫 `done_acting` 時直接回傳 `"step_tracker"`，並移除已不再使用的 `routeAfterStepAssertion` 函數。
- [x] 1.2 修改 `backend/src/graph.ts` ([graph.ts](file:///c:/works/e2e-manager-ts/backend/src/graph.ts))。在 `buildGraph()` 中移除 `step_asserter` 節點的註冊與相關路由邊（如原本 `routeAfterStepAssertion` 對應的邊）。

## 2. 更新 Executor Prompt

- [x] 2.1 修改 `backend/src/graph/prompt.ts` ([prompt.ts](file:///c:/works/e2e-manager-ts/backend/src/graph/prompt.ts)) 的 `buildExecutorSystemPrompt`。首先修正模板以在提示詞中明確印出 `Step Expected Outcome` (若存在)，接著更新 Done Acting 的規則引導，要求模型在呼叫 `done_acting` 之前，必須透過工具等待（如 `waitStrategy`）或等待工具確保該步驟的 `stepExpected` 結果已完全符合。


## 3. 系統驗證與測試

- [x] 3.1 啟動 dev 伺服器並執行一項範例 E2E 測試，確保在各步驟動作執行完後直接推進步驟，不再調用 `step_asserterNode` 的 LLM 視覺斷言，且測試可正常且更快速地通過。
