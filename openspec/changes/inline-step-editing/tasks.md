## 1. 建立 TestCaseStepItem 元件

- [x] 1.1 建立 `TestCaseStepItem.tsx` 用以渲染單個步驟的唯讀與行內編輯介面
- [x] 1.2 在唯讀狀態下，實作滑鼠 Hover 時浮現控制按鈕 (編輯、刪除、上移、下移)
- [x] 1.3 在編輯狀態下，提供操作描述 Input、預期結果 Switch 與預期結果 Input，並提供儲存與取消按鈕
- [x] 1.4 在其它項目處於編輯中時，將唯讀項目的控制按鈕設定為 disabled 狀態以防衝突

## 2. 整合與狀態重構

- [x] 2.1 修改 `TestCaseDetailView.tsx`，在步驟分頁中引入並渲染 `TestCaseStepItem` 列表
- [x] 2.2 於 `TestCaseDetailView.tsx` 實作 `handleAddStep` 邏輯，點擊時僅在前端 array 新增空白暫存項目並將其設為編輯狀態，不呼叫 API
- [x] 2.3 於 `TestCaseDetailView.tsx` 實作單步儲存 API 更新邏輯 `handleSaveStep` (含修改與新增儲存)
- [x] 2.4 於 `TestCaseDetailView.tsx` 實作單步取消邏輯 `handleCancelStep` (若為未儲存空白步驟則從前端移除)
- [x] 2.5 於 `TestCaseDetailView.tsx` 實作單步刪除與上下移動 API 更新邏輯 (`handleDeleteStep` 與 `handleMoveStep`)
- [x] 2.6 移除不再使用的 `TestCaseEditBlock.tsx` 檔案與其引用
- [ ] 2.7 將「新增步驟」按鈕從頂部控制列移除，改在步驟列表下方渲染為 Bento 虛線卡片 (樣式 B)

## 3. 測試與驗證

- [ ] 3.1 驗證專案是否能成功編譯，無 TypeScript 與 ESLint 錯誤
- [ ] 3.2 於本地瀏覽器驗證既有步驟的修改與即時儲存/取消功能
- [ ] 3.3 於本地瀏覽器驗證步驟刪除與順序移動功能
- [ ] 3.4 於本地瀏覽器驗證「新增步驟」的暫存狀態，點擊取消時能無縫移除且點擊儲存時才正確寫入資料庫
