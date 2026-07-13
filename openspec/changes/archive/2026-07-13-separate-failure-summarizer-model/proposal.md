## Why

目前系統的失敗總結報告模型（`summarizer_model`）依賴於資料庫的 `aiConfig.provider` 欄位進行實例化，但前端 UI 設定中缺乏該欄位的輸入項目，導致該欄位在更新設定時被覆蓋為空值。這造成後端實例化失敗總結模型時發生錯誤或與執行器模型產生不一致的配置。

此外，目前的執行器與總結器共享同一個 `geminiModel` 或 `openaiModel` 模型名稱設定，使得使用者無法在兩者選用同一個供應商時（例如皆使用 Google Gemini）設定不同的模型名稱。同時，目前的失敗總結機制一律會將失敗截圖發送給總結模型，這導致不支援多模態（Vision）的非視覺模型在執行總結時會拋出錯誤。

本變更旨在於系統全域設定中獨立配置「執行器」與「失敗總結報告模型」的供應商與模型名稱，並新增是否傳送失敗截圖的開關，以支援非多模態模型並提供更彈性的模型設定。

## What Changes

- **新增設定項**：
  - 於全域設定的 AI 模型配置區塊中，新增「失敗總結器供應商 (provider)」的獨立下拉選單。
  - 新增總結器專用的「Gemini 總結器模型名稱 (summarizerGeminiModel)」與「OpenAI 總結器模型名稱 (summarizerOpenaiModel)」輸入欄位。
  - 新增「傳送失敗截圖 (sendFailureScreenshot)」的開關（Boolean），預設為開啟。
- **配置連動驗證**：調整前端表單驗證規則，當「執行器」選用 Gemini/OpenAI，其對應的執行器模型名稱必填；當「失敗總結器」選用 Gemini/OpenAI，其對應的總結器模型名稱必填。只要任一者啟用了對應供應商，其金鑰與 URL 參數即為必填。
- **失敗總結邏輯調整**：後端在調用總結模型時，需根據 `sendFailureScreenshot` 的值決定是否附加 base64 截圖。若關閉，則只發送測試日誌與文字資訊，以相容非多模態模型。
- **後端實例化 Fallback 強化**：在 `getSummarizerModel` 實例化時，若總結器專用模型欄位未填，可回退到執行器的模型名稱設定。並在 OpenAI 實例化時增加預設 Fallback 值，防止參數缺失而導致崩潰。

## Capabilities

### New Capabilities

*(無)*

### Modified Capabilities

- `system-settings`: 於全域配置中，將總結器供應商、總結器專用模型名稱與 `sendFailureScreenshot` 設定項加回前端表單與 UI，並在後端正確映射、儲存與套用。

## Impact

- **資料庫實體**：`backend/src/entities/SystemSetting.ts` 中的 `aiConfig` 欄位型別需擴充支援 `summarizerGeminiModel`、`summarizerOpenaiModel` 與 `sendFailureScreenshot`。
- **前端元件**：修改 `frontend/src/views/SettingsView.tsx`，更新 `aiConfigSchema` 驗證，並在「AI 模型配置」中新增總結器配置區塊（供應商與截圖開關），並使模型名稱輸入框分流為執行器與總結器各自專屬的欄位。
- **後端服務**：
  - `backend/src/services/settingsService.ts`：更新 `DEFAULT_AI_CONFIG` 以包含新欄位的預設值。
  - `backend/src/services/llmFactory.ts`：修改 `getSummarizerModel` 使其讀取總結器專屬的模型名稱，並強化預設值與 Fallback 機制。
  - `backend/src/graph.ts`：修改失敗總結節點，依 `sendFailureScreenshot` 設定決定是否將截圖傳遞給 LLM。
