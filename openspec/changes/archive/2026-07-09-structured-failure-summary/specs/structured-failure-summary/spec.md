## ADDED Requirements

### Requirement: Structured AI Failure Summarization on E2E Failure
當 E2E 驗收測試執行結果為失敗（FAIL）或出錯（ERROR）時，系統 MUST 呼叫具有結構化輸出（Structured Output）約束的 Gemini/OpenAI 模型進行分析。

#### Scenario: Generate structured summary output
- **WHEN** 測試步驟執行重試次數超過限制且最終判定為 FAIL
- **THEN** 系統呼叫結構化模型，模型 MUST 回傳包含 `step`（失敗步驟）、`reason`（原因分析）與 `suggestion`（修復建議）這三個欄位的 Zod 結構物件。
- **THEN** 系統將該物件以原生 JSON/JSONB 物件格式儲存於資料庫，API 傳輸層直接以 JSON 物件回傳，前端直接進行型別安全的 Bento Card 渲染。

### Requirement: Database JSONB storage for failureSummary
系統的 TestRun 實體中的 `failureSummary` 欄位 MUST 變更為 JSONB 資料庫型別，並具有與 Zod Schema 嚴格對齊的結構。
