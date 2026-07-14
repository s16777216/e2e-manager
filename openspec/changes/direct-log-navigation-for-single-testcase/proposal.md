# Proposal: Single Testcase Direct Log Navigation (單一測試案例直接導航至控制台日誌)

## Executive Summary (簡介)
在現行的 UI 流程中，當使用者於「全域執行紀錄」點擊某筆單一測試案例的執行紀錄，或者於「測試案例詳情頁」點擊「執行測試」時，系統皆會先導航至批次任務詳情頁（`TaskDetailView`）。然而對於單一案例的執行而言，`TaskDetailView` 中僅有一個 Run 項目，使用者必須再手動點擊一次「查看即時日誌」才能進到控制台日誌頁（`SSEConsoleView`）。
本提案旨在優化導航路徑：**當執行範圍為單一案例 (scope === 'testcase') 時，點擊執行紀錄或點擊執行測試後，將直接導航至該測試案例的控制台日誌頁 (`/project/:projectId/run/:runId`)。**

## Motivation & Goals (動機與目標)
- **簡化操作體驗**：減少單一案例執行情境下的多餘點擊，實現一鍵直達實時日誌與執行結果。
- **維持批次任務體驗**：全專案 (project) 與測試群組 (group) 批次任務仍維持導向 `TaskDetailView`，展現整體進度條與多案例卡片。
- **超詳細規格支援**：提供高度明確、零模糊空間的 API 回傳欄位與前端路由判斷 logic，確保實作模型能精確完成修改。

## Proposed Changes (主要變更)

### 1. 後端 REST API 變更 (`backend/src/routes/task.ts` & `backend/src/routes/testcase.ts`)
- **`GET /tasks` (全域任務歷史列表 API)**：
  - 格式化回傳 JSON 時，對於每一個任務，額外帶入其對應的第一筆 `runId` 欄位 (`runId: t.runs?.[0]?.id || null`)。
- **`POST /testcases/:id/run` (單一案例觸發執行 API)**：
  - 觸發執行成功的回應 JSON 中，除了回傳 `taskId` 外，額外包含其生成的首筆 `runId` 欄位 (`{ success: true, taskId: string, runId: string }`)。

### 2. 前端介面型態定義 (`frontend/src/types/api.ts`)
- 更新 `Task` 介面，新增 `runId?: string | null` 選擇性欄位。

### 3. 前端頁面跳轉邏輯 (`frontend/src`)
- **`frontend/src/views/HistoryView.tsx` (全域執行紀錄)**：
  - 在 `DataTable` 的 `onRowDbClick` 事件中判斷：若 `row.scope === "testcase"` 且 `row.runId` 存在，則直接 navigate 至 `/project/${row.projectId || "unknown"}/run/${row.runId}`；否則維持原本導向 `/project/${row.projectId || "unknown"}/tasks/${row.id}`。
- **`frontend/src/features/projects/pages/TestCaseDetailView.tsx` (測試案例詳情)**：
  - 在 `handleRunTestCase` 觸發執行後，讀取回應的 `res.runId`，並直接 navigate 至 `/project/${projectId}/run/${res.runId}`。

## Non-Goals (非本次範圍)
- 不改變 `SSEConsoleView` (控制台日誌頁) 內部的視覺樣式與 SSE 串流 logic。
- 不改變全專案 (project) 與群組 (group) 批次執行的導向邏輯。

## Affected Files (影響檔案)
- `backend/src/routes/task.ts`
- `backend/src/routes/testcase.ts`
- `frontend/src/types/api.ts`
- `frontend/src/views/HistoryView.tsx`
- `frontend/src/features/projects/pages/TestCaseDetailView.tsx`
