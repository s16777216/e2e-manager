## Context

系統在 E2E 測試失敗時，會透過 `getSummarizerModel` 實例化模型來生成失敗總結報告。然而目前後端此方法依賴 `aiConfig.provider`，而前端 UI 並未提供 `provider` 欄位供使用者設定，造成儲存設定時該欄位在資料庫中遺失或為空，最終使失敗總結功能失效。

同時，失敗報告生成一律會附帶 Base64 失敗截圖。對於不支援 Vision 的非多模態模型（如某些本地 Ollama 模型），這會導致調用時出現錯誤。

## Goals / Non-Goals

**Goals:**
- 在前端 `SettingsView` 中加回「失敗總結器供應商」欄位，讓用戶可獨立設定執行器與失敗總結報告模型的 AI 供應商。
- 新增「傳送失敗截圖」開關，支援不具備多模態（非視覺）功能的 LLM。
- 完善前後端的 Schema 與欄位驗證，當任一供應商需要 Google 或 OpenAI 時，正確要求對應憑證。
- 強化後端 `getSummarizerModel` 的預設 Fallback，確保系統在缺省配置時能健全運作。

**Non-Goals:**
- 不修改 `SystemSetting` 以外的其他資料表。

## Decisions

### 1. 前端 UI 欄位分流與動態驗證
在 [[SettingsView.tsx](file:///c:/works/e2e-manager-ts/frontend/src/views/SettingsView.tsx)] 中，原先只針對 `executorProvider` 的值來動態要求金鑰。現在新增 `provider`（總結器供應商）後，金鑰與 URL 驗證規則需要改為聯集判斷。
*   **Gemini 憑證必填**：`executorProvider === 'google' || provider === 'google'`
*   **OpenAI 憑證必填**：`executorProvider === 'openai' || provider === 'openai'`

此外，新增 `sendFailureScreenshot`（布林值）設定，在前端 UI 渲染為 Switch 開關。

### 2. 後端 llmFactory Fallback 提升
在 [[llmFactory.ts](file:///c:/works/e2e-manager-ts/backend/src/services/llmFactory.ts)] 中，`getSummarizerModel` 的 OpenAI 部分加上參數預設值，以保持與 `getExecutorModel` 一致的穩健性：
*   `model`: `aiConfig.openaiModel || "gpt-4o"`
*   `apiKey`: `aiConfig.openaiApiKey || "ollama"`
*   `baseUrl`: `aiConfig.baseUrl || "http://localhost:11434/v1"`

### 3. 失敗總結截圖發送邏輯
在 [[graph.ts](file:///c:/works/e2e-manager-ts/backend/src/graph.ts)] 的失敗總結區塊中，讀取 `aiConfig.sendFailureScreenshot` 的狀態：
*   如果為 `true`（或未定義，預設為 `true`），則像以前一樣在 `HumanMessage` 中附加截圖的 `image_url`。
*   如果為 `false`，則在 `HumanMessage` 中僅傳送純文字提示，例如「由於設定已關閉截圖發送或該模型不支援多模態，故此處不提供失敗截圖」，以此避免非多模態模型出錯。

## Risks / Trade-offs

- **[Risk]** 使用者使用非多模態模型，但忘了將「傳送失敗截圖」關閉，導致 LLM API 報錯。
  - **Mitigation**: 在前端 Switch 開關下方加入醒目的輔助描述提示：「若您使用的失敗總結模型不支援多模態（如非 Vision 視覺模型），請務必關閉此選項以防呼叫錯誤」。
