## 1. 前端表單與列表修復 (Frontend Form & List Fixes)

- [x] 1.1 修改 `frontend/src/views/ModelManageView.tsx`，替換無效的 `useContext(FormContext)` 為 `react-hook-form` 的 `useWatch({ name: "provider" })`，確保選擇 OpenAI Compatible 時即時展開 `baseUrl` 輸入框，編輯現有模型時能正確回填。
- [x] 1.2 在 `frontend/src/views/ModelManageView.tsx` 的表格清單中，針對 `provider === "openai"` 的模型，在供應商欄位中呈現所設定之 `baseUrl`（或未設定之預設端點說明）。
- [x] 1.3 移除未被使用的 `frontend/src/components/custom/form/FormContext.tsx` 檔案。

## 2. 建置編譯與功能驗證 (Build & Verification)

- [x] 2.1 執行前後端建置編譯（`npm run build`），確保 TypeScript 與 Vite 打包無型別與語法錯誤。
- [x] 2.2 執行後端既有測試（`npm test`），確保現有測試全數通過不受影響。
- [x] 2.3 驗證建立與更新包含 `baseUrl` 之 OpenAI Compatible 模型設定運作正常。
