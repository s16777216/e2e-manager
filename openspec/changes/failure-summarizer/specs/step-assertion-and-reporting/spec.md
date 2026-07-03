## MODIFIED Requirements

### Requirement: Markdown test report generation
測試案例結束後，系統 MUST 產生一份 Markdown 格式的測試報告，內容包含：測試案例 ID、名稱、執行時間、各步驟描述、各步驟對應的截圖連結、最終判定結果（Pass/Fail/Error）以及 LLM 判定結果的理由說明。若測試結果為失敗（FAIL）或出錯（ERROR），報告中 MUST 包含 AI 失敗原因總結（Failure Summary）與修復建議。

#### Scenario: Generate final report
- **WHEN** 測試案例結束且最終判定完成
- **THEN** 系統於報告目錄輸出 `report.md`，該檔案包含所有步驟詳情與對應的截圖檔案路徑，且若測試失敗，則包含 AI 失敗原因總結
