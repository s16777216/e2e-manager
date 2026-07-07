## ADDED Requirements

### Requirement: Testcase Last Run Status Display
系統在專案詳情頁面的測試案例列表中，MUST 顯示該測試案例最後一次執行的狀態。該狀態 MUST 正確反映所有歷史執行（TestRun）中，依據時間（createdAt）排序最新的執行結果。

#### Scenario: Display latest status correctly
- **WHEN** 測試案例存在多筆歷史執行紀錄且包含不同的狀態
- **THEN** 專案詳情頁面的列表中，該測試案例的執行狀態欄位 SHALL 顯示時間最新（最晚建立）的那一筆執行的狀態
