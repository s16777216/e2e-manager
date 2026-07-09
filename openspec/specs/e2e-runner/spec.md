# e2e-runner Specification

## Purpose
端到端執行核心，包含步驟解析、執行佇列、Gemini/OpenAI 多模態決策、observe_web_page 視覺感知標籤貼紙、各操作工具 (click/input/key/hover) 與等待策略、Replay 重放模式、Executor 節點整合步驟預期結果判定與動作等待、以及最後 Asserter 節點廢除視覺斷言的邏輯。
## Requirements
### Requirement: TS JSON Test Scenario Parsing
系統 MUST 能夠解析符合結構的 JSON 測試劇本檔案（使用 Zod 進行欄位驗證），包含：唯一的 `id`、腳本名稱 `name`、測試步驟清單 `steps` 與預期結果描述 `expected`。

#### Scenario: Parse TS valid test cases
- **WHEN** 系統讀取一個格式正確的 TS JSON 測試劇本
- **THEN** 系統成功解析並初始化測試步驟佇列與預期結果變數

### Requirement: TS Step-by-Step execution queue
系統 MUST 依照測試步驟清單的順序，逐步調度並完成每一個步驟。在步驟 $n$ 成功完成前，不得執行步驟 $n+1$。

#### Scenario: Execute TS steps in sequence
- **WHEN** 系統啟動測試案例
- **THEN** 系統從第一個步驟（$n=1$）開始執行，成功完成後依序前進到下一個步驟，直到所有步驟執行完畢

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

### Requirement: observe_web_page tool
系統 MUST 提供 `observe_web_page` 工具，用以擷取網頁中所有可見、可互動的元素（例如按鈕、連結、輸入框、下拉選單），將這些元素標記唯一數字 ID，並回傳格式化後的純文字清單。

#### Scenario: 成功提取可互動元素
- **WHEN** 呼叫 `observe_web_page` 工具
- **THEN** 系統 SHALL 過濾掉隱藏或 `disabled` 的元素，並在剩餘的互動元素上注入 `data-e2e-agent-id` 屬性，回傳包含 `[ID] <tagName> textContent` 格式的元素清單字串。

### Requirement: Visual ID Tag Overlay
系統在 `observe_web_page` 執行過程中，MUST 於網頁畫面上對應元素位置渲染黃底黑字的數字貼紙，以便多模態模型能夠在截圖上直觀看到標籤，並在截圖結束後自動清理該貼紙。

#### Scenario: 渲染與清除視覺貼紙
- **WHEN** 系統執行 observe 流程並擷取畫面
- **THEN** 網頁會短暫呈現 ID 浮動貼紙，完成截圖後，這些貼紙與相關 CSS SHALL 被完全移除，不留下任何殘餘樣式影響原始網頁排版。

### Requirement: Click action tool
系統 MUST 提供基於 ID 的 `click` 工具，支援點擊指定 ID 的元素，並可選宣告非同步等待策略。當無提供 `waitStrategy` 時，點擊後直接回傳結果。

#### Scenario: 使用 ID 進行點擊並等待特定文字出現
- **WHEN** 呼叫 `click` 工具，傳入 `id: 15`，`waitStrategy: "waitForText"` 及 `expectedText: "儲存成功"`
- **THEN** 系統點擊該元素，並在 5 秒內等待網頁畫面上出現 `"儲存成功"` 文本，若超時則拋出對應錯誤提示。

#### Scenario: 使用 ID 進行點擊不附加等待
- **WHEN** 呼叫 `click` 工具，傳入 `id: 8` 且未提供 `waitStrategy`
- **THEN** 系統點擊該元素後立即回傳成功訊息。

### Requirement: Input action tool
系統 MUST 提供基於 ID 的 `input` 工具，支援在指定 ID 的輸入框元素中填入文字。

#### Scenario: 使用 ID 進行文字輸入
- **WHEN** 呼叫 `input` 工具，傳入 `id: 12` 與 `text: "test_username"`
- **THEN** 系統 SHALL 在 `[data-e2e-agent-id="12"]` 元素中填入該文字。

### Requirement: Key action tool
系統 MUST 提供基於 ID 或全域的 `key` 工具，支援模擬鍵盤按鍵事件，並可選附加非同步等待策略。

#### Scenario: 對特定元素按 Enter 鍵並等待換頁
- **WHEN** 呼叫 `key` 工具，傳入 `id: 12`，`key: "Enter"` 及 `waitStrategy: "waitForNavigation"`
- **THEN** 系統 focus 到 `[data-e2e-agent-id="12"]`，發送 `"Enter"` 按鍵，並等待網頁載入狀態進入 `networkidle`。

#### Scenario: 按下特定鍵並等待文字出現
- **WHEN** 呼叫 `key` 工具，傳入 `id: 5`，`key: "Enter"`，`waitStrategy: "waitForText"` 及 `expectedText: "查詢中..."`
- **THEN** 系統 focus 到 `[data-e2e-agent-id="5"]` 元素並發送 `"Enter"` 按鍵，並在 5 秒內等待網頁畫面上出現 `"查詢中..."` 文本。

#### Scenario: 按下鍵盤鍵不附加等待
- **WHEN** 呼叫 `key` 工具，傳入 `key: "Escape"` 且未提供 `waitStrategy`
- **THEN** 系統向目前頁面發送 `"Escape"` 按鍵並立即回傳成功。

### Requirement: Hover action tool
系統 MUST 提供基於 ID 的 `hover` 工具，支援將滑鼠懸停至指定 ID 的元素上。

#### Scenario: 使用 ID 進行懸停操作
- **WHEN** 呼叫 `hover` 工具，傳入 `id: 8`
- **THEN** 系統 SHALL 將滑鼠游標移動至 `[data-e2e-agent-id="8"]` 元素上方。

### Requirement: Executor-level Step Expected Result Validation
系統 MUST 廢棄步驟執行完畢後呼叫獨立模型（step_asserterNode）進行步驟級視覺預期結果判定之邏輯。步驟的正確性與等待 SHALL 整合至 Executor 節點的操作工具鏈中進行。在 Executor 決策過程中，系統 Prompt MUST要求並引導 AI 在面臨有設定 `stepExpected` 的非同步變化步驟時，必須在其操作工具中使用等待參數（如 `waitStrategy`）或呼叫等待工具，以確保在呼叫 `done_acting` 前該預期結果已達成。

#### Scenario: 步驟執行完成後直接推進
- **WHEN** AI E2E Agent 在步驟中呼叫 `done_acting` 宣告動作完成
- **THEN** 狀態機 SHALL 直接將該步驟狀態標記為 `passed`，並自動推進至下一個步驟，不調用視覺斷言 LLM 模型。

#### Scenario: 點擊後等待 Toast 出現
- **WHEN** 當前步驟有預期結果為 "出現錯誤訊息：帳號或是密碼錯誤" 且 AI 準備執行 click 操作
- **THEN** AI SHALL 呼叫 `click` 工具並傳送 `waitStrategy: "waitForText"` 及 `expectedText: "帳號或是密碼錯誤"`，在等待成功後才呼叫 `done_acting`。

### Requirement: Bypassing Overall Visual Expected Result Check
系統 MUST 廢棄在測試最後的獨立驗證節點（asserterNode），並將成功的測試結果標記與瀏覽器關閉整合至流程終點的 `reporterNode`。

#### Scenario: 測試所有步驟均順利完成
- **WHEN** 測試流程中所有定義的步驟均已被 AI 成功執行且單步預期結果（step_expecteds）均校驗通過，且流程到達 reporterNode
- **THEN** 系統 SHALL 自動將 TestRun 的 finalResult 設為 "PASS"，finalReason 設為 "所有測試步驟均已成功執行完畢。"，並安全關閉 Playwright 瀏覽器實例。

