## ADDED Requirements

### Requirement: Project List View Testcase Count
專案管理列表頁面（專案列表首頁）的表格中，各專案的「測試案例數」欄位 SHALL 顯示該專案旗下所有測試群組中所屬測試案例的加總數量。

#### Scenario: Display testcase count in project list
- **WHEN** 載入專案管理列表頁面時
- **THEN** 表格中每個專案的「測試案例數」欄位 SHALL 顯示為該專案旗下所有測試案例的加總數（大於等於 0）
