# Proposal: Single Testcase Direct Log Navigation

## Why

單一測試案例執行目前會先進入僅包含一筆 Run 的 TaskDetailView，使用者仍須再次操作才能查看即時日誌。此變更讓單一案例可直接進入 SSEConsoleView，同時保留群組與專案批次執行的既有流程。

## What Changes

- `GET /tasks` 為所有 task 回傳完整的 `TaskRun[]`，並依 `createdAt ASC` 排序。
- `POST /testcases/:id/run` 維持既有 `{ taskId, runs: TaskRun[] }` 回應契約，不新增頂層 `runId` 或 `success`。
- TestCaseDetailView 觸發單一案例後，使用 `runs[0].runId` 直接導航至 `/project/:projectId/run/:runId`。
- HistoryView 維持雙擊操作；當 `scope === "testcase"` 且存在 `runs[0].runId` 時，直接進入 SSEConsoleView。
- 單一案例缺少 runId 但仍有 projectId 時，顯示 warning toast 並降級至 TaskDetailView。
- task 缺少 projectId 時，留在 HistoryView 並顯示 error toast，避免導航至無效的 `project/unknown` 路徑。
- 群組與專案批次任務仍導航至 TaskDetailView。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `web-dashboard`: 單一測試案例可從觸發頁面或全域歷史紀錄直接進入即時日誌；批次任務仍使用批次監控頁面。

## Impact

- `backend/src/routes/task.ts`：在全域任務列表回應中加入排序穩定的完整 `runs` 摘要。
- `frontend/src/views/HistoryView.tsx`：依 task scope、run 與 project 資料執行雙擊導航及錯誤降級。
- `frontend/src/features/projects/pages/TestCaseDetailView.tsx`：使用既有 `runs[0].runId` 導航並處理缺值。
- API 不含 breaking change；`backend/src/routes/run.ts` 的單一案例執行回應格式維持不變。
