## ADDED Requirements

### Requirement: Bypassing independent step visual expected result check
系統 MUST 廢棄步驟執行完畢後呼叫獨立模型（step_asserterNode）進行步驟級視覺預期結果判定之邏輯。步驟的正確性與等待 SHALL 整合至 Executor 節點的操作工具鏈中進行。

#### Scenario: 步驟執行完成後直接推進
- **WHEN** AI E2E Agent 在步驟中呼叫 `done_acting` 宣告動作完成
- **THEN** 狀態機 SHALL 直接將該步驟狀態標記為 `passed`，並自動推進至下一個步驟，不調用視覺斷言 LLM 模型。

### Requirement: Action-time wait verification for step expected results
在 Executor 決策過程中，系統 Prompt MUST 要求並引導 AI 在面臨有設定 `stepExpected` 的非同步變化步驟時，必須在其操作工具中使用等待參數（如 `waitStrategy`）或呼叫等待工具，以確保在呼叫 `done_acting` 前該預期結果已達成。

#### Scenario: 點擊後等待 Toast 出現
- **WHEN** 當前步驟有預期結果為 "出現錯誤訊息：帳號或是密碼錯誤" 且 AI 準備執行 click 操作
- **THEN** AI SHALL 呼叫 `click` 工具並傳送 `waitStrategy: "waitForText"` 及 `expectedText: "帳號或是密碼錯誤"`，在等待成功後才呼叫 `done_acting`。
