# project-views Specification

## Purpose
TBD - created by archiving change project-independent-views. Update Purpose after archive.
## Requirements
### Requirement: Project Creation View
系統 SHALL 提供專屬的專案建立頁面，路由路徑為 `/project/new`。該頁面 SHALL 渲染專案名稱、專案描述等輸入欄位。

#### Scenario: Navigate and create project
- **WHEN** 使用者於 `/project/new` 填寫有效的專案名稱並送出
- **THEN** 前端呼叫建立專案 API，建立成功後自動跳轉至該專案的詳情頁面 `/project/:projectId`

### Requirement: Project Edit View
系統 SHALL 提供專屬的專案編輯頁面，路由路徑為 `/project/:projectId/edit`。該頁面 SHALL 載入該專案的現有設定，並以區塊化卡片（Bento Card Settings）佈局分別展示基本資訊、Cookies 設定、LocalStorage 設定與危險區域。每個設定區塊 SHALL 包含就近的獨立儲存按鈕，支援局部資料提交與獨立的 JSON 驗證，儲存成功後頁面維持在編輯頁。

#### Scenario: Edit and save general settings
- **WHEN** 使用者修改專案名稱或描述，並點擊基本資訊區塊的儲存按鈕
- **THEN** 前端局部提交專案更新 API，提示儲存成功，且頁面維持在當前編輯頁

#### Scenario: Edit and save advanced environment settings
- **WHEN** 使用者在 Cookies 或 LocalStorage 區塊中輸入有效的 JSON 設定，並點擊該區塊的儲存按鈕
- **THEN** 前端僅對對應欄位提交更新 API，提示儲存成功，且頁面維持在當前編輯頁

#### Scenario: Delete project with verification
- **WHEN** 使用者於 `/project/:projectId/edit` 的危險區域卡片點擊刪除，並在 Dialog 中輸入與專案完全相同的名稱後點擊確定
- **THEN** 前端呼叫刪除專案 API，刪除完成後自動跳轉回專案列表首頁 `/project`

### Requirement: Project Detail View Group Item Count
在專案詳細頁面（Project Detail View）的樹狀表格中，群組（Test Group）的「子項目/步驟數」欄位在群組尚未展開前，也 SHALL 能夠顯示正確的子項目總數（包含子群組數量及測試案例數量之總和）。

#### Scenario: Display pre-calculated count before group expansion
- **WHEN** 載入專案詳細頁面且群組尚未展開時
- **THEN** 表格中群組的「子項目/步驟數」欄位顯示為其子群組數量與該群組所含測試案例數量的總和（大於等於 0），而不是預設顯示為 0。

