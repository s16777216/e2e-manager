## 1. 後端開發

- [ ] 1.1 修改 backend/src/routes/project.ts 的 GET / 路由，新增 testcase 數量查詢並合併至專案列表
- [ ] 1.2 重啟後端伺服器，並透過 API 請求驗證 GET /api/projects 回傳的專案資料包含正確的 testcaseCount 數值

## 2. 前端開發

- [ ] 2.1 修改 frontend/src/types/api.ts 中的 Project 介面，新增選擇性欄位 testcaseCount?: number
- [ ] 2.2 檢查 frontend/src/features/projects/columns/projectColumns.tsx 中 測試案例數 欄位的渲染型別與渲染結果是否正確顯示
- [ ] 2.3 瀏覽器開啟專案管理頁面，驗證表格中的「測試案例數」是否正確呈現非空數值
