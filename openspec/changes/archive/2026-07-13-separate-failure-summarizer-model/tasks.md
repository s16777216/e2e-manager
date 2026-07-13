## 1. 後端修改

- [x] 1.1 修改 `backend/src/entities/SystemSetting.ts` 中的 `aiConfig` 型別定義，新增 `summarizerGeminiModel?: string`、`summarizerOpenaiModel?: string` 與 `sendFailureScreenshot?: boolean`
- [x] 1.2 修改 `backend/src/services/llmFactory.ts` 的 `getSummarizerModel`，使其讀取 `summarizerGeminiModel` / `summarizerOpenaiModel`，並為其分流新增對應的 Fallback 機制
- [x] 1.3 修改 `backend/src/services/settingsService.ts`，在 `DEFAULT_AI_CONFIG` 中將 `provider` 與 `executorProvider` 的預設值設為 `"google"`，並新增 `summarizerGeminiModel: ""`、`summarizerOpenaiModel: ""` 與 `sendFailureScreenshot: true` 預設配置
- [x] 1.4 修改 `backend/src/graph.ts` 中調用 `summarizer_model` 的部分，讀取 `aiConfig.sendFailureScreenshot` 狀態。若為 `false`，則不傳送 Base64 截圖（改為傳送純文字提示），藉此支援非多模態模型

## 2. 前端修改

- [x] 2.1 修改 `frontend/src/views/SettingsView.tsx`，在 `aiConfigSchema` 驗證中加入 `provider`、`sendFailureScreenshot`、`summarizerGeminiModel` 與 `summarizerOpenaiModel` 欄位，並將 `superRefine` 改為聯集與各自獨立模型名稱的驗證
- [x] 2.2 修改 `frontend/src/views/SettingsView.tsx` 中的 `DEFAULT_AI_CONFIG`，加入對應欄位的預設值
- [x] 2.3 修改 `frontend/src/views/SettingsView.tsx` 中的 `fetchSettings` 與 state，新增新增對應欄位的狀態管理，以供設定欄位讀取與儲存
- [x] 2.4 修改 `frontend/src/views/SettingsView.tsx` 的 UI 渲染，拆分「執行器配置」與「失敗總結器配置」，提供各自專屬的模型名稱輸入框與「傳送失敗截圖」Switch，並調整底下的連動顯示與憑證欄位顯示邏輯

## 3. 功能驗證

- [x] 3.1 啟動專案，進入系統設定，測試儲存「執行器供應商」與「失敗總結器供應商」分別為 Google Gemini 與 OpenAI 的組合，且為兩者設定不同的模型名稱，並關閉「傳送失敗截圖」開關，驗證其能通過表單驗證與成功寫入資料庫
- [x] 3.2 執行一次故意失敗的測試案例，驗證後端在關閉截圖發送的情況下，是否能成功調用所設定的獨立總結模型，且在不附帶截圖的情況下生成失敗總結
