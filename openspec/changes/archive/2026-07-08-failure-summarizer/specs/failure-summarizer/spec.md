## ADDED Requirements

### Requirement: AI Failure Summarization on E2E Failure
當 E2E 驗收測試執行結果為失敗（FAIL）或出錯（ERROR）時，系統 SHALL 呼叫 Gemini LLM 對測試進行失敗原因分析。系統傳入的上下文 MUST 包含：測試案例步驟與預期、步驟執行期間的完整工具呼叫日誌、最終瀏覽器網址與最終畫面截圖。Gemini LLM 需產出包含「失敗步驟」、「可能原因分析」與「改善/修復建議」的 Traditional Chinese 失敗報告總結。

#### Scenario: Generate failure summary for step execution failure
- **WHEN** 測試步驟執行重試次數超過限制且最終判定為 FAIL
- **THEN** 系統呼叫 LLM 進行分析，並產出 Traditional Chinese 失敗報告總結

#### Scenario: Generate failure summary for visual assertion failure
- **WHEN** 測試步驟跑完但視覺斷言判定為 FAIL
- **THEN** 系統呼叫 LLM 進行分析，並產出 Traditional Chinese 失敗報告總結

### Requirement: Persistence of Failure Summary
系統 MUST 將產出的 AI 失敗原因總結（Failure Summary）儲存至資料庫中對應 `TestRun` 的 `failureSummary` 欄位。

#### Scenario: Store failure summary to database
- **WHEN** AI 失敗原因總結生成完畢
- **THEN** 系統更新 `TestRun` 的 `failureSummary` 欄位並存檔

### Requirement: Real-time failure summary broadcast via SSE
系統在測試執行完成且 AI 失敗原因總結儲存後，MUST 將 `failureSummary` 作為 `test_run_logs` 廣播事件的 payload 屬性，實時發送至前端。

#### Scenario: Broadcast failure summary through SSE on completion
- **WHEN** 測試執行狀態變更為 completed，且 AI 失敗原因總結已生成並儲存
- **THEN** 系統發送 SSE 通知，payload 中包含 `failureSummary` 內容

### Requirement: Frontend Display of AI Failure Summary
前端 UI 於 Console 監控視窗（SSEConsoleView）與測試案例執行歷史（TestCaseDetailView）中，當該次執行結果狀態為 failed 或 error 且含有 `failureSummary` 時，MUST 於結果看板下方以顯眼的卡片/面板（例如「AI 失敗分析與建議」）展示此失敗原因總結，且該面板 MUST 支援 Markdown 格式渲染。

#### Scenario: Display failure summary card on failed test case
- **WHEN** 使用者進入 `SSEConsoleView` 或 `TestCaseDetailView` 檢視 failed 狀態的執行紀錄
- **THEN** 系統顯示「AI 失敗分析與建議」面板，並渲染儲存的 Markdown 失敗總結
