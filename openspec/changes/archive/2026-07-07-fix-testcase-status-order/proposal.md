## Why

目前專案詳細頁面中的「執行狀態」欄位顯示不正確。當測試案例有多筆執行紀錄 (TestRun) 時，由於資料庫返回的 `runs` 陣列順序不固定，前端隨機取最後一個元素作為最新狀態，導致使用者無法看到真正的最後一次執行結果。

## What Changes

* 修改後端獲取測試案例的相關 APIs，在查詢 `Testcase` 實體載入 `runs` 關係時，明確依據建立時間 `createdAt` 進行升序 (`ASC`) 排序，確保最新執行紀錄始終在陣列的最後。
* （選用）前端 `ProjectDetailView` 的 `buildNestedTree` 邏輯加入防禦性設計，以避免任何因 API 返回順序不一致造成的狀態誤判。

## Capabilities

### New Capabilities
<!-- 無新增 Capabilities -->

### Modified Capabilities
- `testcase-management`: 在測試案例的管理與列表中，新增「正確顯示最後一次執行狀態」的規範。

## Impact

* **後端路由**：
  * `backend/src/routes/testcase.ts` (API 端點 `GET /groups/:groupId/testcases`, `GET /testcases/:id`, `PATCH /testcases/:id`)
* **前端頁面**：
  * `frontend/src/features/projects/pages/ProjectDetailView.tsx`
