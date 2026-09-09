# web-dashboard Specification (Delta)

## MODIFIED Requirements

### Requirement: Testcase Run Details and Real-time SSE Log Stream
系統 MUST 在觸發測試執行後，以實時日誌流（Log Stream）與步驟截圖展示執行過程。單一測試案例執行 MUST 從 TestCaseDetailView 或全域 HistoryView 直接進入 `/project/:projectId/run/:runId`（SSEConsoleView）；群組或專案批次執行 MUST 進入 `/project/:projectId/tasks/:taskId`（TaskDetailView）。全域任務列表 MUST 為每筆 task 回傳完整的 `TaskRun[]` 摘要，並依 Run 的 `createdAt ASC` 排序。在日誌渲染與歷史紀錄呈現中，系統 MUST 依據後端所傳輸之結構化步驟執行實體（TestRunStep）來渲染步驟 Section/Accordion。該步驟卡片中 MUST 包含該步驟所關聯的詳細工具操作軌跡與時間，且步驟實體所關聯的網頁截圖 MUST 作為該步驟的最終狀態顯示於該 Section 下方。系統 MUST 在每個執行步驟中紀錄並即時顯示該步驟累計消耗的 LLM Token 數量，並在 Accordion Header 上渲染對應的 Token 消耗 Badge 與步驟成敗狀態（包括 pending、running、passed、failed 等）。任務結束後，系統 MUST 渲染最終視覺斷言 PASS/FAIL 的判定報告，且該判定報告中 MUST 一並展示視覺斷言判定所花費的 Token 以及整次 Run 消耗的總 Token 數。系統頂部全域麵包屑中的測試案例名稱連結 MUST 支援點擊並正確導回所屬測試案例詳情頁 `/project/:projectId/testCase/:testCaseId`。所有通知與錯誤回饋 MUST 採用 Sonner (Toaster) 進行 Toast 訊息提示。TaskDetailView 中的批次任務狀態與 TestRun 狀態 MUST 採用統一的狀態組件（StatusBadge）進行一致化視覺渲染（包括 pending、running、passed、failed、error）。

#### Scenario: Return ordered run summaries in global task history
- **WHEN** 前端取得全域任務列表
- **THEN** 每筆 task MUST 包含完整的 `TaskRun[]` 摘要，且陣列 MUST 依各 Run 的建立時間由舊至新排列

#### Scenario: Navigate directly after triggering a single testcase
- **WHEN** 使用者在 TestCaseDetailView 觸發單一測試案例，且既有 API 回應 `{ taskId, runs: TaskRun[] }` 中存在 `runs[0].runId`
- **THEN** 前端 MUST 直接導航至 `/project/:projectId/run/:runId`

#### Scenario: Navigate directly from global history
- **WHEN** 使用者在 HistoryView 雙擊 `scope === "testcase"`、具有有效 `projectId` 且 `runs[0].runId` 存在的任務紀錄
- **THEN** 前端 MUST 直接導航至 `/project/:projectId/run/:runId`

#### Scenario: Fall back when a single-testcase run is missing
- **WHEN** 單一案例的觸發回應或 HistoryView 任務紀錄缺少 `runs[0].runId`，但具有有效的 `projectId`
- **THEN** 前端 MUST 顯示 warning toast，並導航至 `/project/:projectId/tasks/:taskId`

#### Scenario: Stay in history when project context is missing
- **WHEN** 使用者在 HistoryView 雙擊缺少有效 `projectId` 的任務紀錄
- **THEN** 前端 MUST 顯示 error toast 並留在 HistoryView，不得導航至包含 `project/unknown` 的路徑

#### Scenario: Navigate to TaskDetailView for batch execution
- **WHEN** 使用者觸發群組或專案批次測試，或在 HistoryView 雙擊 `scope === "project"` 或 `scope === "group"` 且具有有效 `projectId` 的任務紀錄
- **THEN** 前端 MUST 導航至 `/project/:projectId/tasks/:taskId`，顯示 TaskDetailView 批次監控面板及統一的 StatusBadge

#### Scenario: Stream live steps log with token usage metrics
- **WHEN** 使用者直接導航或經由 TaskDetailView 進入 `/project/:projectId/run/:runId` 並建立 SSE 連線訂閱
- **THEN** 前端 MUST 即時接收後端以巢狀結構傳送之步驟及其關聯日誌更新事件，直接渲染步驟列表及其 Token 消耗，且不需在前端執行日誌分群計算

#### Scenario: Display final assert report with total run token usage
- **WHEN** 測試案例執行完畢，視覺斷言（Asserter）返回判定結果與理由
- **THEN** 前端 MUST 在上方即時渲染視覺斷言報告，除了展示結果與原因外，也必須展示視覺斷言花費的 Token 與整次測試執行所花費的總 Token 數量

#### Scenario: Save and display logs for failed steps
- **WHEN** 測試案例執行在特定步驟因錯誤中斷或重試超限而失敗
- **THEN** 後端系統 MUST 將該步驟之狀態設為 failed，並將該步驟未完成的暫存日誌與失敗截圖存入資料庫並透過 SSE 發送，且前端時間軸中 MUST 能依據該步驟 status 屬性直接呈現並展開該失敗步驟的 Accordion 卡片以呈現具體錯誤軌跡與失敗畫面
