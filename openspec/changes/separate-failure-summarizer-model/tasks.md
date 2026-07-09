## 1. 後端修改

- [ ] 1.1 修改 `backend/src/entities/SystemSetting.ts` 中的 `aiConfig` 型別定義，新增 `sendFailureScreenshot?: boolean`
- [ ] 1.2 修改 `backend/src/services/llmFactory.ts` 的 `getSummarizerModel`，為其 OpenAI 分流新增 `openaiModel || "gpt-4o"`、`openaiApiKey || "ollama"` 與 `baseUrl || "http://localhost:11434/v1"` 的 Fallback 機制
- [ ] 1.3 修改 `backend/src/services/settingsService.ts`，在 `DEFAULT_AI_CONFIG` 中將 `provider` 與 `executorProvider` 的預設值設為 `"google"`，並新增 `sendFailureScreenshot: true` 預設配置
- [ ] 1.4 修改 `backend/src/graph.ts` 中調用 `summarizer_model` 的部分，讀取 `aiConfig.sendFailureScreenshot` 狀態。若為 `false`，則不傳送 Base64 截圖（改為傳送純文字提示），藉此支援非多模態模型

## 2. 前端修改

- [ ] 2.1 修改 `frontend/src/views/SettingsView.tsx`，在 `aiConfigSchema` 驗證中加入 `provider` 與 `sendFailureScreenshot` 欄位，並將 `superRefine` 改為聯集驗證（`executorProvider === 'google' || provider === 'google'` 驗證 Gemini；`executorProvider === 'openai' || provider === 'openai'` 驗證 OpenAI）
- [ ] 2.2 修改 `frontend/src/views/SettingsView.tsx` 中的 `DEFAULT_AI_CONFIG`，加入 `provider: ""` 與 `sendFailureScreenshot: true`
- [ ] 2.3 修改 `frontend/src/views/SettingsView.tsx` 中的 `fetchSettings` 與 state，新增 `provider` 與 `sendFailureScreenshot` 狀態管理，以供設定欄位讀取與儲存
- [ ] 2.4 修改 `frontend/src/views/SettingsView.tsx` 的 UI 渲染，在「執行器配置」下方新增「失敗總結器配置」，提供「總結器供應商」下拉選單（選值有 `google` 與 `openai`）及「傳送失敗截圖」Switch 開關，並調整底下的模型與憑證輸入框的聯動顯示邏輯

## 3. 功能驗證

- [ ] 3.1 啟動專案，進入系統設定，測試儲存「執行器供應商」與「失敗總結器供應商」分別為 Google Gemini 與 OpenAI 的組合，且關閉「傳送失敗截圖」開關，驗證其能通過表單驗證與成功寫入資料庫
- [ ] 3.2 執行一次故意失敗的測試案例，驗證後端在關閉截圖發送的情況下，是否能成功實例化模型且在不附帶截圖的情況下生成失敗總結
