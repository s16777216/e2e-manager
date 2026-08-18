# Tasks: Single Testcase Direct Log Navigation

## Tasks

- [ ] 1. 後端 REST API 擴充與修訂 <!-- id: backend-task-api -->
  - [ ] 1.1 修改 `backend/src/routes/task.ts` 的 `GET /tasks` 端點：在 Map/Format 資料處加上 `runId: t.runs?.[0]?.id || null`。
  - [ ] 1.2 修改 `backend/src/routes/testcase.ts` 的 `POST /testcases/:id/run` 端點：回傳物件擴充為 `{ success: true, taskId: task.id, runId: run.id }`。

- [ ] 2. 前端 API 型態與呼叫介面定義修訂 <!-- id: frontend-type-api -->
  - [ ] 2.1 修改 `frontend/src/types/api.ts` 的 `Task` 介面：新增 `runId?: string | null;` 屬性。
  - [ ] 2.2 修改 `frontend/src/lib/api.ts` 的 `triggerRun` 函數回傳型態：為 `<{ success: boolean; taskId: string; runId: string }>`。

- [ ] 3. 前端視圖 (Views) 導航跳轉調整 <!-- id: frontend-view-navigation -->
  - [ ] 3.1 修改 `frontend/src/views/HistoryView.tsx` 中的 `DataTable` `onRowDbClick` 回調：判斷當 `row.scope === "testcase"` 且 `row.runId` 存在時，navigate 至 `/project/${row.projectId || "unknown"}/run/${row.runId}`。
  - [ ] 3.2 修改 `frontend/src/features/projects/pages/TestCaseDetailView.tsx` 中的 `handleRunTestCase` 函數：於 API 觸發成功後讀取 `res.runId`，將 Toast 提示更新為「測試已啟動！正在跳轉即時日誌...」，並 navigate 至 `/project/${projectId}/run/${res.runId}`。

- [ ] 4. 驗證與閉環測試 <!-- id: verification-testing -->
  - [ ] 4.1 測試並確認「單一測試案例詳情」點擊「執行測試」後能直接跳轉至控制台日誌頁。
  - [ ] 4.2 測試並確認在「全域執行紀錄」雙擊單一案例紀錄後能直接跳轉至控制台日誌頁。
  - [ ] 4.3 確認群組與全專案批次執行紀錄仍能正確跳轉至批次任務頁 (`TaskDetailView`)。
