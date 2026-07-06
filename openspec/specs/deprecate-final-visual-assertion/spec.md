# deprecate-final-visual-assertion Specification

## Purpose
TBD - created by archiving change deprecate-final-visual-assertion. Update Purpose after archive.
## Requirements
### Requirement: Bypassing overall visual expected result check
系統 MUST 廢棄在測試最後一節點（asserterNode）調用 LLM 進行最終畫面與全局預期結果（testcase.expected）比對判定之邏輯，改為自動標記測試結果為 PASS，並正常關閉瀏覽器。

#### Scenario: 測試所有步驟均順利完成
- **WHEN** 測試流程中所有定義的步驟均已被 AI 成功執行且單步預期結果（step_expecteds）均校驗通過
- **THEN** 系統 SHALL 在 asserterNode 自動將 TestRun 的 finalResult 設為 "PASS"，finalReason 設為 "所有測試步驟均已成功執行完畢。"，並安全關閉 Playwright 瀏覽器實例。

