## Context

系統原本在每個測試步驟執行完（呼叫 `done_acting`）後，會流轉到 `step_asserterNode`。此節點會再次截圖並呼叫一個獨立的多模態 LLM（`asserter_model`）來驗證步驟的 `stepExpected` 預期結果。
然而，這引發了非同步競爭（Race Condition，例如 Toast 在點擊後秒速消失，導致截圖時已不存在）以及高昂的 token 與時間開銷。在工具鏈（`click` 與 `key`）已具備 `waitStrategy` 定位與等待的能力後，此獨立驗證節點已可被安全廢棄。

## Goals / Non-Goals

**Goals:**
- 從 LangGraph 狀態機中移除 `step_asserterNode` 節點。
- 簡化路由，在 Executor 呼叫 `done_acting` 後，直接流轉到 `step_trackerNode` 推進下一個步驟。
- 更新 `buildExecutorSystemPrompt` 規則，強制規定 AI 必須在操作工具中進行非同步等待（例如使用 `waitForText` 或是等待工具），確保網頁載入或預期訊息出現後才宣告 `done_acting`。

**Non-Goals:**
- 不刪除 `TestcaseStep` 實體中的 `expected` 與 `hasExpected` 欄位（保留作為 Executor 判斷預期結果以及前端顯示使用）。
- 不調整 `reporterNode` 行為，在發生錯誤或超限時的截圖與報告產生邏輯依舊維持。

## Decisions

### 1. 調整狀態機流轉路由
- **做法**：修改 `backend/src/graph/router.ts` 中的 `routeAfterExecution`。當 `action` 包含 `"done_acting"` 時，無論是否存在 `stepExpected`，一律回傳 `"step_tracker"`。
- **好處**：完全繞過並廢棄了 `step_asserterNode`。
- **替代方案**：
  - *方案 B (保留 asserter 但不調 LLM)*：在 `step_asserterNode` 內部直接標記為 PASS 不呼叫 LLM。缺點是狀態機中依然有冗餘節點。

### 2. 從 `graph.ts` 拔除 `step_asserterNode` 節點與路由邊
- **做法**：在 `E2EGraphBuilder` 中，移除 `step_asserterNode` 的定義，並在 `buildGraph()` 中移去該節點與條件路由邊（移除對 `routeAfterStepAssertion` 的依賴）。

### 3. 重構 Executor System Prompt，確立「動作即驗證」的原則
- **做法**：修改 `backend/src/graph/prompt.ts` 的 `buildExecutorSystemPrompt`。
  - 修正 `buildExecutorSystemPrompt` 模板輸出，將 `stepExpected`（若存在）明確渲染於 `Current Step` 之後（例如 `- Step Expected Outcome: "..."`），否則 AI 無法得知預期結果。
  - 修改規則 5，移除 "Do NOT attempt to verify step outcomes" 的句子。
  - 加入明確說明：「如果該步驟有設定預期結果（`stepExpected`）或會產生非同步頁面變化（例如出現特定的 Toast、錯誤文字、頁面加載等），你**必須**在該操作工具中使用等待策略（如 `click` 的 `waitStrategy="waitForText"` 搭配 `expectedText`），或使用 `wait_for_seconds` 工具，確認網頁已經處於預期狀態後，才能呼叫 `done_acting`。」


## Risks / Trade-offs

- **[Risk]** 如果步驟寫著 "確認某段文字消失"，而工具目前只支援 `waitForText` (等文字出現)，AI 可能無法單純靠 tool 的 wait 屬性來完成。
  - **Mitigation**：此時 AI 可以使用 `wait_for_seconds(3)` 作為 fallback，待時間過後觀察頁面確認已消失，再呼叫 `done_acting`。
