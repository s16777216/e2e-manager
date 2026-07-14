# web-dashboard Specification (Delta)

## Requirements

### Requirement: Testcase Run Details and Real-time SSE Log Stream
系統 MUST 在觸發測試執行後，以實時日誌流（Log Stream）與步驟截圖展示執行過程。前端在單一測試案例觸發執行後，MUST 將畫面直接轉導至 `/project/:projectId/run/:runId` 路由（SSEConsoleView）；若執行範圍為多案例之群組或專案批次，則轉導至 `/project/:projectId/tasks/:taskId` 路由（TaskDetailView）。

#### Scenario: Navigate directly to SSEConsoleView when triggering single testcase execution
- **WHEN** 使用者在「測試案例詳情頁 (`TestCaseDetailView`)」點擊「執行測試」按鈕，且後端成功回應 `runId` 時
- **THEN** 前端 MUST 直接 navigate 導航至該筆測試案例的即時日誌主頁 `/project/:projectId/run/:runId`

#### Scenario: Navigate directly to SSEConsoleView from global history for single testcase row
- **WHEN** 使用者在「全域執行紀錄頁 (`HistoryView`)」雙擊或點擊執行範圍為「單一案例 (`scope === 'testcase'`)」的紀錄列，且該紀錄包含有效的 `runId` 時
- **THEN** 前端 MUST 直接 navigate 導航至 `/project/:projectId/run/:runId`

#### Scenario: Navigate to TaskDetailView for batch project or group execution
- **WHEN** 使用者點擊群組批次或全專案批次測試執行，或在全域執行紀錄頁點擊範圍為 `project` / `group` 的任務紀錄時
- **THEN** 前端 MUST navigate 導航至 `/project/:projectId/tasks/:taskId` 顯示批次監控面板
