## Why

當 E2E 驗收測試執行失敗（FAIL）或出錯（ERROR）時，目前的系統僅回傳非常簡短、缺乏上下文的靜態錯誤訊息（例如「步驟 2 執行次數達到上限但仍未完成」）。這使得開發人員無法快速釐清失敗的根本原因，必須手動點開所有步驟的 AI 推理歷程、工具執行結果以及逐步截圖來逐一排查。因此，需要引入 AI 失敗總結器（Failure Summarizer），在測試失敗或出錯時，自動分析執行歷程與失敗畫面，產出人類易讀的失敗原因總結與修復建議。

## What Changes

- **AI 失敗分析與總結**：在 E2E 測試圖（LangGraph）執行失敗或發生 Error 時，呼叫 LLM 分析步驟目標、預期結果、詳細執行 log 以及最終失敗畫面，生成 Traditional Chinese 的失敗總結。
- **資料庫欄位新增**：於 `TestRun` 實體新增 `failureSummary` 欄位以持久化 AI 總結。
- **SSE 與 API 擴展**：將 `failureSummary` 納入實時事件推送（SSE）與測試執行結果查詢 API。
- **測試報告 Markdown 擴增**：在產出的 Markdown 驗收測試報告中，自動將失敗總結嵌入「測試摘要」章節。
- **前端 Bento 卡片展示**：前端執行歷史及即時 Console 監控介面中，針對 Failed/Error 的 TestRun 顯示顯眼的「AI 失敗分析與建議」面板，支援 Markdown 渲染與直觀的錯誤定位提示。

## Capabilities

### New Capabilities
- `failure-summarizer`: 當 E2E 測試執行結果為 FAIL 或 ERROR 時，利用 LLM 對測試的完整 Logs 和失敗時的截圖進行綜合分析，產出結構化、高可讀性的 Traditional Chinese 失敗報告（包含失敗步驟、根本原因、修復建議），並持久化於資料庫中。

### Modified Capabilities
- `step-assertion-and-reporting`: 擴展測試報告生成邏輯，在測試報告（report.md）中將產出的失敗總結加入摘要部分，並提供前端展示所需的失敗總結 API。

## Impact

- **Database**: `TestRun` 實體需要新增 `failureSummary` 欄位。
- **Backend Graph**: `backend/src/graph.ts` 中的 `reporterNode` 或流程終止處理邏輯需要調用 LLM 生成總結，並儲存到資料庫中。
- **Backend Reporter**: `backend/src/reporter.ts` 生成報告的 Markdown 結構需要加入 AI 失敗總結。
- **Backend Router**: API 路由與 SSE 事件載荷需要加入 `failureSummary` 欄位。
- **Frontend App**: `TestCaseDetailView.tsx` 與 `SSEConsoleView.tsx` 需要新增對 `failureSummary` 的面板呈現。
