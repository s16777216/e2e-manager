## 1. 後端排序實作

- [x] 1.1 修改 `backend/src/routes/testcase.ts` 中的 `GET /groups/:groupId/testcases` API，在 order 屬性中加上 `runs: { createdAt: "ASC" }`。
- [x] 1.2 修改 `backend/src/routes/testcase.ts` 中的 `GET /testcases/:id` API，在 order 屬性中加上 `runs: { createdAt: "ASC" }`。
- [x] 1.3 修改 `backend/src/routes/testcase.ts` 中的 `PATCH /testcases/:id` API，在更新後重新獲取測試案例的 order 屬性中加上 `runs: { createdAt: "ASC" }`。

## 2. 驗證與測試

- [x] 2.1 啟動系統，對特定測試案例進行多次執行，產生不同結果 of `TestRun`（如先 fail 後 pass，或先 pass 後 fail）。
- [x] 2.2 於專案詳情頁面的表格中驗證該測試案例的「執行狀態」欄位，確認其始終顯示最後一次執行的狀態，不隨頁面整理或資料載入而變更。

