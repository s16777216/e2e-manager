## MODIFIED Requirements

### Requirement: LLM TS Step Reasoning using Playwright Tools
對於每個步驟，系統 MUST 支援「重放模式 (Replay Mode)」與「LLM 推導模式 (Agent Mode)」的雙軌執行。
- 當該測試步驟於先前的執行中已有成功完成（`passed`）的工具執行日誌（`TestLog`）時，系統 MUST 進入重放模式，依序執行該成功日誌中的工具呼叫，而不發送請求給 LLM。
- 當重放過程中拋出任何異常（例如 Playwright 執行工具超時、元素不可見等），或者該步驟原本就沒有成功的重放日誌時，系統 MUST 進入 LLM 推導模式（自我修復），將「當前步驟描述」、「當前網址」、「當前 DOM 結構」與「當前視窗截圖」發送給 Gemini LLM。由 LLM 根據這些資訊，決策並呼叫合適的 Playwright 模擬操作工具，並在網址相符時引導其呼叫 finish_step。系統向 LLM 發送提示詞時，MUST 使用結構化全英文的 System Prompt (English Core) 作為角色定義、步驟引導與強烈規則約束，以確保最高的指令遵循率與工具調用精準度。

#### Scenario: Execute TS tool call for step via Replay
- **WHEN** 執行步驟時，若該步驟存在上一次執行成功（passed）的工具執行紀錄
- **THEN** 系統直接重放舊有的工具紀錄，完成步驟操作，而不呼叫 LLM 進行推導

#### Scenario: Execute TS tool call for step via Agent fallback
- **WHEN** 執行步驟時，若無歷史成功紀錄，或是重放工具時發生 Playwright 異常
- **THEN** 系統自動切換回 LLM 推導模式，由 Gemini LLM 重新觀察頁面並推導出正確的操作，並更新該步驟的成功工具紀錄
