## ADDED Requirements

### Requirement: Agent Can Execute Browser JavaScript
系統必須向測試 Agent 提供 `execute_javascript` 工具，以便 Agent 可以在當前頁面 Context 執行任意 DOM 操作腳本，並取得傳回值或 Error 訊息。

#### Scenario: Agent calls execute_javascript with valid DOM selection
- **WHEN** Agent 傳入包含 `document.querySelector('.p-multiselect-option').click()` 的腳本字串
- **THEN** 系統透過 `page.evaluate()` 執行並回傳包含執行成功與傳回值的文字結果

#### Scenario: Script execution encounters an error
- **WHEN** Agent 傳入無效語法或找不到 DOM 的 JS 腳本引發例外
- **THEN** 系統將捕捉 Error 並回傳格式化錯誤訊息，且不會導致整個後端服務 Crash

### Requirement: System Prompt Guidance for JavaScript Tool
系統會在引導 Agent 的 Prompt 中，明確說明 `execute_javascript` 的用途與選單選項點擊情境。

#### Scenario: Agent receives prompt instruction for dynamic elements
- **WHEN** 測試步驟啟動並載入系統提示詞
- **THEN** 提示詞包含了說明當 `observe_web_page` 未捕捉到標籤 ID 時，可使用 `execute_javascript` 補救的指引
