## MODIFIED Requirements

### Requirement: LLM TS Step Reasoning using Playwright Tools
對於每個步驟，系統 MUST 支援「重放模式 (Replay Mode)」與「LLM 推導模式 (Agent Mode)」的雙軌執行。
- **重放觸發條件**：當全域設定 `enableReplay` 為開啟，且該測試步驟於先前的執行中已有相同測試案例版本（`testcaseVersion`）且成功完成（`passed`）的工具執行日誌（`TestLog`）時，系統 MUST 進入重放模式，依序執行該成功日誌中的工具呼叫，而不發送請求給 LLM。
- **DOM ID 自動保障**：在重放模式下，若即將執行需要 `id` 參數的工具前，或在執行頁面跳轉工具（如 `navigate_to`）後，系統 MUST 確保呼叫 `observeWebPage()` 刷新頁面之 `data-e2e-agent-id` 標記。
- **自我修復判定與無縫交棒**：當重放過程中發生以下任一狀況：
  1. 工具執行拋出例外；
  2. 工具回傳字串包含「失敗」或開頭為「錯誤」；
  3. 等待元素超時超過 2000ms；
  系統 MUST 判定重放失敗並啟動自我修復（Self-healing）：拋棄當前步驟已執行的重放暫存日誌，保留瀏覽器當前畫面現場，將單步重試計數（`step_retry_count`）歸零，呼叫 `observeWebPage()` 重新感知並切換回 LLM 推導模式。由 LLM 根據「當前步驟描述」、「當前網址」、「當前 DOM 結構」與「當前視窗截圖」重新推導合適的動作，並在完成時呼叫 `done_acting`。

#### Scenario: Execute TS tool call for step via Replay
- **WHEN** 執行測試步驟時，全域 `enableReplay` 開啟，且該步驟存在相同 `testcaseVersion` 之最新 passed 執行紀錄
- **THEN** 系統依序重放舊有的工具日誌並於操作前確保 DOM ID 存在，完成步驟操作，消耗 0 個 LLM Token

#### Scenario: Bypass Replay on Version Mismatch
- **WHEN** 執行測試步驟時，該測試案例版本已更新（`version` 不等於歷史紀錄之 `testcaseVersion`），或全域 `enableReplay` 為關閉
- **THEN** 系統略過重放模式，直接進入 LLM 推導模式進行決策

#### Scenario: Execute TS tool call for step via Self-healing fallback
- **WHEN** 執行重放時，工具回傳失敗、超時 2000ms 或拋出例外
- **THEN** 系統自動拋棄該步重放暫存日誌，重設單步重試次數，保留瀏覽器現場並由 LLM 重新觀察推導出正確操作，於測試通過後更新成功日誌
