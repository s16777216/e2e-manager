## ADDED Requirements

### Requirement: Project Detail View Group Item Count
在專案詳細頁面（Project Detail View）的樹狀表格中，群組（Test Group）的「子項目/步驟數」欄位在群組尚未展開前，也 SHALL 能夠顯示正確的子項目總數（包含子群組數量及測試案例數量之總和）。

#### Scenario: Display pre-calculated count before group expansion
- **WHEN** 載入專案詳細頁面且群組尚未展開時
- **THEN** 表格中群組的「子項目/步驟數」欄位顯示為其子群組數量與該群組所含測試案例數量的總和（大於等於 0），而不是預設顯示為 0。
