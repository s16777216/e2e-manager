## Why

目前系統的失敗總結報告模型（`summarizer_model`）依賴於資料庫的 `aiConfig.provider` 欄位進行實例化，但前端 UI 設定中缺乏該欄位的輸入項目，導致該欄位在更新設定時被覆蓋為空值。這造成後端實例化失敗總結模型時發生錯誤或與執行器模型產生不一致的配置。

此外，目前的失敗總結機制一律會將失敗截圖發送給總結模型，這導致不支援多模態（Vision）的非視覺模型（如某些本地 Ollama 模型）在執行總結時會拋出錯誤。

本變更旨在於系統全域設定中獨立配置「失敗總結報告模型」的供應商，並新增是否傳送失敗截圖的開關，以支援非多模態模型的運作。

## What Changes

- **新增設定項**：
  - 於全域設定的 AI 模型配置區塊中，新增「失敗總結器供應商 (provider)」的獨立下拉選單。
  - 新增「傳送失敗截圖 (sendFailureScreenshot)」的開關（Boolean），預設為開啟。
- **配置連動驗證**：調整前端表單驗證規則，當「執行器」或「失敗總結器」任一者選用 Google Gemini 或 OpenAI 相容模型時，對應的金鑰、URL 與模型名稱均改為必填。
- **失敗總結邏輯調整**：後端在調用總結模型時，需根據 `sendFailureScreenshot` 的值決定是否附加 base64 截圖。若關閉，則只發送測試日誌與文字資訊，以相容非多模態模型。
- **後端實例化 Fallback 強化**：在 `getSummarizerModel` 實例化 OpenAI 模型時，增加與執行器一致的預設 Fallback 值，防止參數缺失而導致崩潰。

## Capabilities

### New Capabilities

*(無)*

### Modified Capabilities

- `system-settings`: 於全域配置中，將 `provider`（做為失敗總結器供應商）與 `sendFailureScreenshot` 設定項加回前端表單與 UI，並在後端正確映射、儲存與套用。

## Impact

- **資料庫實體**：`backend/src/entities/SystemSetting.ts` 中的 `aiConfig` 欄位型別需擴充支援 `sendFailureScreenshot`。
- **前端元件**：修改 `frontend/src/views/SettingsView.tsx`，更新 `aiConfigSchema` 驗證，並在「AI 模型配置」中新增總結器配置區塊、總結器供應商下拉選單與截圖發送開關。
- **後端服務**：
  - `backend/src/services/settingsService.ts`：更新 `DEFAULT_AI_CONFIG` 以包含 `provider` 與 `sendFailureScreenshot` 的預設值。
  - `backend/src/services/llmFactory.ts`：強化 `getSummarizerModel` 實例化時的預設值機制。
  - `backend/src/graph.ts`：修改失敗總結節點，依 `sendFailureScreenshot` 設定決定是否將截圖傳遞給 LLM。
