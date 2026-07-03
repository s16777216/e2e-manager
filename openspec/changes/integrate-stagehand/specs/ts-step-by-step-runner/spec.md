## MODIFIED Requirements

### Requirement: LLM TS Step Reasoning using Playwright Tools
系統 MUST 將測試步驟描述直接委託給 Stagehand 的 AI 驅動瀏覽器操作介面（即 `page.act`）。系統不需要手動拼裝並向 LLM 發送簡化 DOM 及自定義的 Playwright 工具鏈，改由 Stagehand 內部自主處理元素定位（含自癒機制）、步驟推理與操作執行，直到該步驟被判定完成。

#### Scenario: Execute TS tool call for step
- **WHEN** 系統調度執行單一測試步驟時
- **THEN** 系統呼叫 Stagehand 的 `page.act`，將步驟文字描述作為參數傳入，並由 Stagehand 自主執行網頁互動操作直至步驟結束
