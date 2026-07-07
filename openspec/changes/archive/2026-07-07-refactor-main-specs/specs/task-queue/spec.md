## ADDED Requirements

### Requirement: Queue-based Task Runner with Concurrency Limit
背景任務執行器 SHALL 實作非同步先進先出 (FIFO) 佇列。佇列狀態 MUST 儲存於資料庫的 `test_runs` 表中，且執行器 MUST 使用資料庫交易行級鎖定（如 `FOR UPDATE SKIP LOCKED`）安全地領取任務，確保多個 Worker 平行運作時不會發生重複領取任務的 race condition，且併發執行數限制為 1。Worker MUST 在每個 TestRun 執行完成後，原子性地更新其所屬 Task（若存在）的 `doneCount` 欄位，並在 doneCount 達到 totalCount 時設定 Task.status = "done" 及計算 Task.finalResult，透過 `task_updates` pg_notify 通道發送完成事件。

#### Scenario: Queue task when concurrent runner limit reached
- **WHEN** 系統當前正在執行一個 E2E 測試任務，此時再次觸發新的執行任務
- **THEN** 新的任務寫入資料庫，狀態設為 `pending`，並在佇列中排隊等待，直到先前的任務執行完畢釋放資源

#### Scenario: Worker updates Task progress after TestRun completes
- **WHEN** Worker 完成一個 TestRun 的執行（status 更新為 passed/failed/error），且該 TestRun 的 task 外鍵不為 null
- **THEN** Worker MUST 以原子 SQL 更新 Task.doneCount = doneCount + 1，並透過 task_updates pg_notify 通道發送 progress 事件；若 doneCount 等於 totalCount，則同時設定 Task.status = "done"、計算 finalResult 並發送 completed 事件

### Requirement: Step execution status persistence
在 LangGraph 逐步執行狀態機的生命週期中，執行器 MUST 在每個步驟完成、重試或出錯時，即時更新資料庫中對應 `test_runs` 的目前狀態。執行器 MUST 將步驟截圖存檔為實體檔案，將步驟日誌（包含步驟內容、AI 決策、工具呼叫、結果與截圖路徑）寫入資料庫的 `test_logs` 表中，且 MUST 發送資料庫即時異步通知（如 `NOTIFY` 通道）發佈此步驟事件，以供訂閱者進行即時串流。

#### Scenario: Update progress log and notify instantly after step complete
- **WHEN** LangGraph `stepTrackerNode` 完成當前步驟，存檔步驟截圖檔案，並寫入資料庫 `test_logs` 表
- **THEN** 系統透過資料庫 `NOTIFY` 通道發出步驟完成通知事件，使訂閱該通道的 API 伺服器能即時串流該日誌與截圖路徑

### Requirement: Unified Task Execution Container
系統 MUST 提供 `Task` 實體作為所有測試執行觸發的頂層容器。`Task` SHALL 支援三種執行範圍（scope）：`"project"`（執行整個專案的所有測試案例）、`"group"`（執行指定群組及其子群組的所有測試案例）與 `"testcase"`（執行單一測試案例）。`Task` 實體 MUST 持久化記錄 `scope`、`scopeId`（對應資源的 UUID）、`totalCount`（此批次排入的測試案例總數）、`doneCount`（已完成的執行數）、`status`（`pending` / `running` / `done`）、`finalResult`（`PASS` / `FAIL` / `null`）、`createdAt` 與 `finishedAt`。

#### Scenario: Create Task and TestRuns when triggering project-wide execution
- **WHEN** 使用者呼叫 `POST /api/projects/:projectId/run`
- **THEN** 系統 MUST 建立一個 scope="project" 的 Task，查詢該專案下所有測試案例並為每個案例建立一個關聯的 TestRun（status=pending），Task.totalCount = 測試案例數量，API 回傳 `{ taskId, runs: [{ runId, testcaseName, status }] }`

#### Scenario: Create Task and TestRuns when triggering group execution
- **WHEN** 使用者呼叫 `POST /api/groups/:groupId/run`
- **THEN** 系統 MUST 建立一個 scope="group" 的 Task，遞迴查詢該群組及其所有子群組下的測試案例並為每個案例建立關聯的 TestRun，Task.totalCount = 測試案例數量，API 回傳 `{ taskId, runs: [{ runId, testcaseName, status }] }`

#### Scenario: Create Task and single TestRun when triggering single testcase execution
- **WHEN** 使用者呼叫 `POST /api/testcases/:id/run`
- **THEN** 系統 MUST 建立一個 scope="testcase" 的 Task，並建立一個關聯的 TestRun（status=pending），Task.totalCount = 1，API 回傳 `{ taskId, runs: [{ runId, testcaseName, status }] }`

### Requirement: Task Query and SSE Stream APIs
系統 MUST 提供 REST API 以查詢 Task 詳情與執行進度。`GET /api/tasks/:taskId` SHALL 回傳 Task 的所有欄位及其所屬 TestRun 的摘要（runId、testcaseId、testcaseName、status）。`GET /api/tasks/:taskId/stream` MUST 提供 Server-Sent Events 串流，訂閱 `task_updates` pg_notify 通道，僅回傳屬於指定 taskId 的 progress 與 completed 事件。`GET /api/projects/:projectId/tasks` SHALL 回傳該專案歷史上所有 Task 的列表（含 status、scope、totalCount、doneCount、finalResult、createdAt），依建立時間降冪排列。

#### Scenario: Retrieve task detail with run statuses
- **WHEN** 前端發送 `GET /api/tasks/:taskId`
- **THEN** API 回傳 Task 所有欄位及各 TestRun 的 `{ runId, testcaseId, testcaseName, status }` 摘要陣列

#### Scenario: Stream real-time task progress via SSE
- **WHEN** 前端透過 EventSource 訂閱 `GET /api/tasks/:taskId/stream`，且後端 Worker 更新 Task 進度時發送 pg_notify
- **THEN** 前端即時收到 `{ taskId, event: "progress", doneCount, totalCount }` 或 `{ taskId, event: "completed", finalResult }` 事件

#### Scenario: List project task history
- **WHEN** 前端發送 `GET /api/projects/:projectId/tasks`
- **THEN** API 依時間降冪回傳該專案所有 Task 的摘要列表，每個項目包含 taskId、scope、status、finalResult、totalCount、doneCount、createdAt、finishedAt

### Requirement: Global Task Execution History Table
系統 MUST 提供一個跨專案的全域批次任務執行歷史列表，以 shadcn DataTable 組件呈現（使用 `@tanstack/react-table` + `components/ui/table.tsx`）。表格欄位 MUST 包含：任務 ID（前綴 `#` 的短雜湊）、所屬專案名稱、觸發範圍（專案、群組、單一案例）、執行進度（已完成個數 / 總個數）、建立時間、Token 消耗以及結果狀態 Badge。視覺風格 MUST 使用 shadcn 預設主題，不覆蓋 zinc 色號。

#### Scenario: Display global task list
- **WHEN** 使用者進入全域「執行紀錄」頁面且系統載入成功時
- **THEN** 前端將以 shadcn DataTable 形式，依據 `createdAt` 時間由近到遠（降冪）列出所有批次執行任務，並顯示正確的專案名稱與進度狀態

#### Scenario: Navigate to task monitor detail
- **WHEN** 使用者在執行紀錄表格中點擊任一任務行（Row）時
- **THEN** 前端 MUST 將畫面轉導至該任務的詳情監控頁面 `/project/:projectId/tasks/:taskId`

### Requirement: Global History Statistics and Filters
全域執行紀錄頁面上方 MUST 提供篩選控制項，支援依「專案名稱」與「執行結果狀態」進行即時前端過濾。統計指標看板（Bento 磨砂玻璃設計、執行總次數、成功率、當前執行中任務數）MUST 移除，不再顯示。篩選控制項維持下拉選單形式，過濾邏輯在傳入 DataTable 前由 View 層的 `Array.filter()` 處理，不使用 TanStack 的 globalFilter。篩選的狀態選項 MUST 與變更後的 Task 統一狀態一致（包含 passed、failed、error、running、pending）。

#### Scenario: Filter tasks by project and status
- **WHEN** 使用者從下拉選單選擇特定專案或特定狀態（如 passed、failed、error、running、pending）時
- **THEN** 表格將立即過濾只顯示符合篩選條件的任務列表
