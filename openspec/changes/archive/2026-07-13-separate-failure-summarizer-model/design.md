## Context

系統在 E2E 測試失敗時，會透過 `getSummarizerModel` 實例化模型來生成失敗總結報告。目前此方法依賴舊的 `aiConfig.provider` 與共用的模型設定。這使得我們無法在執行器與總結器均選用同一個 AI 供應商時設定不同的模型。此外，前端介面目前完全缺少總結器的相關欄位與是否傳送失敗截圖的開關（導致非多模態模型執行失敗）。

## Goals / Non-Goals

**Goals:**
- 在前端 `SettingsView` 中加回「失敗總結器配置」，提供獨立的「總結器供應商」與「是否傳送失敗截圖」設定。
- 使執行器模型名稱（`geminiModel` / `openaiModel`）與總結器模型名稱（`summarizerGeminiModel` / `summarizerOpenaiModel`）徹底獨立，支援在相同或不同供應商下的自由搭配。
- 完善前後端的 Schema 與欄位驗證，當對應功能選用 Google 或 OpenAI 時，正確要求填入相應的金鑰與模型名稱。
- 強化後端模型實例化時的預設 Fallback。

**Non-Goals:**
- 不修改 `SystemSetting` 以外的其他資料表。

## Decisions

### 1. 前端 UI 欄位分流與獨立驗證
在 [[SettingsView.tsx](file:///c:/works/e2e-manager-ts/frontend/src/views/SettingsView.tsx)] 中，擴充 `aiConfigSchema` 驗證，並在「AI 模型配置」中拆分為兩個配置區域：

*   **執行器配置 (Executor)**：
    *   `executorProvider` (執行器供應商)
    *   `geminiModel` (Gemini 執行器模型)
    *   `openaiModel` (OpenAI 執行器模型)
*   **失敗總結器配置 (Summarizer)**：
    *   `provider` (總結器供應商)
    *   `summarizerGeminiModel` (Gemini 總結器模型)
    *   `summarizerOpenaiModel` (OpenAI 總結器模型)
    *   `sendFailureScreenshot` (是否傳送失敗截圖，Switch)

在 `superRefine` 驗證規則中：
*   **Gemini 憑證必填**：當 `executorProvider === 'google' || provider === 'google'`，`apiKey` 必填。
*   **OpenAI 憑證必填**：當 `executorProvider === 'openai' || provider === 'openai'`，`openaiApiKey` 與 `baseUrl` 必填。
*   **模型名稱必填**：
    *   當 `executorProvider === 'google'`，`geminiModel` 必填。
    *   當 `provider === 'google'`，`summarizerGeminiModel` 必填。
    *   當 `executorProvider === 'openai'`，`openaiModel` 必填。
    *   當 `provider === 'openai'`，`summarizerOpenaiModel` 必填。

### 2. 後端 llmFactory 實例化邏輯
在 [[llmFactory.ts](file:///c:/works/e2e-manager-ts/backend/src/services/llmFactory.ts)] 中，更新 `getSummarizerModel`：
*   若為 Google：
    *   使用 `aiConfig.summarizerGeminiModel || aiConfig.geminiModel || "gemini-2.0-flash"` 作為模型（提供執行器模型作 fallback，以維持相容性）。
*   若為 OpenAI：
    *   使用 `aiConfig.summarizerOpenaiModel || aiConfig.openaiModel || "gpt-4o"` 作為模型。
    *   連線憑證 fallback：`openaiApiKey || "ollama"`，`baseUrl || "http://localhost:11434/v1"`。

### 3. 失敗總結截圖發送邏輯
在 [[graph.ts](file:///c:/works/e2e-manager-ts/backend/src/graph.ts)] 的失敗總結區塊中，讀取 `aiConfig.sendFailureScreenshot` 的狀態：
*   如果為 `true`（或未定義，預設為 `true`），則像以前一樣在 `HumanMessage` 中附加截圖的 `image_url`。
*   如果為 `false`，則在 `HumanMessage` 中僅傳送純文字提示，例如「設定已關閉傳送失敗截圖（使用非多模態模型）」，以此避免非多模態模型出錯。

## Risks / Trade-offs

- **[Risk]** 使用者未設定總結器專屬模型，升級系統後可能出錯。
  - **Mitigation**: 後端 `llmFactory` 會自動以執行器模型作為 Fallback，保證即使新欄位為空依然能正常運作。
