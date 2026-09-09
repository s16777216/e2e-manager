# Tasks: Single Testcase Direct Log Navigation

## Tasks

- [x] 1. 後端 `GET /tasks` 回傳完整 TaskRun 陣列 <!-- id: backend-tasks-api -->
  - [x] 1.1 修改 `backend/src/routes/task.ts` 的 `GET /tasks` 端點：在 Map/Format 資料時，為每筆 task 加入 `runs` 陣列，內容包含 `runId`、`testcaseId`、`testcaseName`、`status`，並依 `createdAt ASC` 排序。
  - [x] 1.2 確認 `POST /testcases/:id/run` 端點維持既有的 `{ taskId, runs: TaskRun[] }` 回應格式，不進行修改。

- [x] 2. 前端 API 型態確認 <!-- id: frontend-type-api -->
  - [x] 2.1 確認 `frontend/src/types/api.ts` 的 `Task` 介面已包含 `runs?: TaskRun[]` 屬性（若有則確認型態正確，若無則新增）。
  - [x] 2.2 確認 `frontend/src/lib/api.ts` 的 `triggerRun` 函數回傳型態為 `<{ taskId: string; runs: TaskRun[] }>`，與後端合約一致。

- [x] 3. 前端 TestCaseDetailView 導航調整 <!-- id: frontend-testcase-view -->
  - [x] 3.1 修改 `frontend/src/features/projects/pages/TestCaseDetailView.tsx` 中的 `handleRunTestCase` 函數：於 API 觸發成功後讀取 `res.runs[0]?.runId`，若存在則顯示「測試已啟動！正在跳轉即時日誌...」Toast 並導航至 `/project/${projectId}/run/${runId}`。
  - [x] 3.2 若 `res.runs[0]?.runId` 不存在，顯示 warning toast「未找到執行記錄，導航至任務詳情」並導航至 `/project/${projectId}/tasks/${res.taskId}`。

- [x] 4. 前端 HistoryView 導航調整 <!-- id: frontend-history-view -->
  - [x] 4.1 修改 `frontend/src/views/HistoryView.tsx` 中的 `DataTable` `onRowDbClick` 回調：若 `row.projectId` 不存在，顯示 error toast 並留在 HistoryView，不進行導航。
  - [x] 4.2 若 `row.scope === "testcase"` 且 `row.runs?.[0]?.runId` 存在，導航至 `/project/${row.projectId}/run/${row.runs[0].runId}`。
  - [x] 4.3 若 `row.scope === "testcase"` 但 `row.runs?.[0]?.runId` 不存在，顯示 warning toast 並導航至 `/project/${row.projectId}/tasks/${row.id}`。
  - [x] 4.4 若 `row.scope === "project"` 或 `row.scope === "group"`，導航至 `/project/${row.projectId}/tasks/${row.id}`（維持既有行為）。

- [x] 5. 驗證與閉環測試 <!-- id: verification-testing -->
  - [x] 5.1 測試並確認「單一測試案例詳情」點擊「執行測試」後能直接跳轉至 SSEConsoleView（即時日誌頁）。
  - [x] 5.2 測試並確認在「全域執行紀錄」雙擊單一案例紀錄後能直接跳轉至 SSEConsoleView。
  - [x] 5.3 確認群組與全專案批次執行紀錄仍能正確跳轉至批次任務頁（TaskDetailView）。
  - [x] 5.4 測試並確認缺少 runId 或 projectId 時的降級提示與導航行為正確。
