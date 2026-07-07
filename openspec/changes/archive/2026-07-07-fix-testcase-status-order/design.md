## Context

在專案詳細頁面中，測試案例列表的「執行狀態」欄位顯示不正確。因為當一個測試案例有多筆 `TestRun` 執行紀錄時，後端查詢 API (`GET /groups/:groupId/testcases` 等) 沒有對關聯的 `runs` 進行任何排序，導致資料庫返回隨機順序的 `runs`，而前端直接讀取最後一個元素 `tc.runs[tc.runs.length - 1]` 造成狀態顯示錯誤。

## Goals / Non-Goals

**Goals:**

- 後端查詢 `Testcase` 並載入 `runs` 關係的相關 APIs 均明確對 `runs` 按 `createdAt` 進行升序 (`ASC`) 排序，確保最新執行紀錄永遠在陣列最後。
- 前端 `ProjectDetailView` 在解析 `lastStatus` 時能夠取得最新的一筆。

**Non-Goals:**

- 修改資料庫 Schema 或 `TestRun` 實體結構。
- 全面修改其他非專案詳細頁面涉及的 API 邏輯（例如 Task 的 runs 排序）。

## Decisions

### 決定 1：在後端 API 對 Testcase.runs 進行 order 排序

- **說明**：在 `backend/src/routes/testcase.ts` 中的以下 APIs 中，於查詢選項的 `order` 加入 `runs: { createdAt: "ASC" }`：
  1. `GET /groups/:groupId/testcases`
  2. `GET /testcases/:id`
  3. `PATCH /testcases/:id` (更新後重新讀取的回傳)
- **理由**：
  - 修改後端是最根本的解決方案，能保證 API 的消費者拿到具備時間順序的執行列表。
  - 由於前端原邏輯為 `tc.runs[tc.runs.length - 1]`，後端採用 `createdAt: "ASC"` 排序可維持前端讀取邏輯不變，修復成本最低。

## Risks / Trade-offs

- **[Risk]**：對 `TestRun.createdAt` 進行排序可能會在大數據量下影響查詢效能。
- **[Mitigation]**：單一測試案例的執行歷史 (runs) 數量有限，若未來數據增長造成瓶頸，可考慮於 `test_run` 資料表建立 `(testcaseId, createdAt)` 的複合索引。
