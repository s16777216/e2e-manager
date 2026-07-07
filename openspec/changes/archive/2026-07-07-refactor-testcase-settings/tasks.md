## 1. 建立測試案例設定 FormBlock 元件

- [x] 1.1 建立 `TestCaseFormGeneralBlock.tsx` 用以編輯測試案例名稱
- [x] 1.2 建立 `TestCaseFormStorageBlock.tsx` 用以編輯 initCookies 與 initLocalStorage 的 JSON 配置
- [x] 1.3 建立 `TestCaseFormVariableBlock.tsx` 用以編輯測試案例環境變數 (VariablesEditor)
- [x] 1.4 建立 `TestCaseFormDangerBlock.tsx` 用以執行刪除測試案例 (TestCaseDeleteDialog)

## 2. 重構步驟編輯器與頁面整合

- [x] 2.1 重構 `TestCaseEditBlock.tsx`，移除名稱、Storage、變數與危險區域編輯，僅保留自然語言步驟與最終預期結果的編輯
- [x] 2.2 修改 `TestCaseDetailView.tsx`，將 `activeTab` 聯集型別擴充為 `"steps" | "history" | "setting"`
- [x] 2.3 在 `TestCaseDetailView.tsx` 的 Tabs 中加入「設定」頁籤的 `TabsTrigger` 與對應 of `TabsContent`
- [x] 2.4 在 `TestCaseDetailView.tsx` 中整合新增的設定 Blocks，並實作各自獨立的 `onSave` 更新 API 呼叫邏輯

## 3. 測試與驗證

- [x] 3.1 驗證前端專案是否能成功編譯，無 TypeScript 與 ESLint 錯誤
- [x] 3.2 於本地瀏覽器測試測試案例步驟編輯功能，確認可成功儲存步驟
- [x] 3.3 於本地瀏覽器測試設定頁面中的基本資訊、Storage 與變數設定，確認各 Block 獨立儲存功能正常
- [x] 3.4 驗證測試案例刪除功能運作正常
