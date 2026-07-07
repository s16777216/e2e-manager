## 1. 後端實作與驗證

- [x] 1.1 修改 `backend/src/routes/group.ts`，在獲取群組列表時執行聚合查詢取得各群組的測試案例數量，並附加至回傳的群組物件中
- [x] 1.2 重啟後端並透過 API 請求驗證 `/projects/:projectId/groups` 回傳的群組資料包含 `testcaseCount` 欄位與正確數值

## 2. 前端實作與驗證

- [x] 2.1 修改前端 `TestGroup` 型別定義（通常在 `frontend/src/types/api.ts` 或相關定義檔），加入 `testcaseCount?: number`
- [x] 2.2 修改 `frontend/src/features/projects/pages/ProjectDetailView.tsx` 中 `buildNestedTree` 計算 `tcCount` 的邏輯，優先採用 `testcasesMap`，未載入時採用 `node.testcaseCount || 0`
- [x] 2.3 啟動前端開發伺服器，驗證專案詳細頁面的左側表格中，群組在展開前其「子項目/步驟數」顯示為正確的子群組與測試案例的總和數量
