## MODIFIED Requirements

### Requirement: TestCase Details and Edit View
系統 MUST 為每個測試案例提供獨立的詳細資訊與編輯頁面。該頁面 MUST 提供 Steps (步驟)、History (歷史執行紀錄) 與 Setting (設定) 分頁（Tabs）。在 Steps 分頁中，使用者僅能檢視與編輯測試案例步驟與最終預期結果。其餘後設設定與管理功能（案例名稱、環境配置、變數與刪除）均移至 Setting 分頁。

#### Scenario: Manage and save testcase steps
- **WHEN** 使用者在測試案例詳情頁的 Steps 分頁中，在編輯模式下點擊「新增下一步」新增自然語言步驟並點擊儲存
- **THEN** 前端將修改後的測試案例步驟與預期結果資料傳送至 API `/api/testcases/:id` 進行儲存，並提示儲存成功，頁面同步更新最新步驟

#### Scenario: Switch to setting tab
- **WHEN** 使用者點擊進入 Setting 分頁
- **THEN** 前端展示該測試案例的所有配置區塊 (基本資訊、Storage設定、環境變數、危險區域)

### Requirement: TestCase Step and Parameter Editing
系統 SHALL 支援測試案例編輯模式，並將編輯權限拆分為「步驟編輯」與「後設參數設定」。步驟編輯僅允許修改步驟清單與最終預期結果；後設參數設定（名稱、Cookies/LocalStorage、環境變數）則透過獨立的 Bento FormBlock 模組進行，每個 FormBlock 均有就近的儲存按鈕進行局部更新。

#### Scenario: Saving test case step edits
- **WHEN** 使用者在 Steps 分頁編輯自然語言步驟後點擊「儲存修改」
- **THEN** 系統呼叫更新 API 並更新測試案例的 steps 與 expected，而不會影響其他欄位

#### Scenario: Saving test case name in setting block
- **WHEN** 使用者在 Setting 分頁的基本資訊 block 中修改名稱並點擊儲存
- **THEN** 系統局部提交更新 API 變更測試案例名稱，且頁面維持在當前設定頁

#### Scenario: Saving test case storage in setting block
- **WHEN** 使用者在 Setting 分頁的 Storage 設定 block 中修改 Cookies 或 LocalStorage 並點擊儲存
- **THEN** 系統局部提交更新 API 變更對應的 JSON 資料，且頁面維持在當前設定頁

#### Scenario: Saving test case variables in setting block
- **WHEN** 使用者在 Setting 分頁的環境變數 block 中修改變數對應表並點擊儲存
- **THEN** 系統局部提交更新 API 變更環境變數配置，且頁面維持在當前設定頁

### Requirement: Deleting Test Case Confirmation
當使用者請求刪除測試案例時，系統 SHALL 顯示二次確認彈窗，要求使用者輸入該測試案例的完整名稱以解鎖確認按鈕，確認後才執行刪除。該刪除入口 MUST 放置於 Setting 分頁的危險區域 (Danger Zone) FormBlock 中。

#### Scenario: Deleting test case with matching confirmation name
- **WHEN** 使用者在 Setting 分頁的危險區域點擊刪除專案按鈕，在 Dialog 中輸入與該測試案例完全相同的名稱後點擊確定
- **THEN** 系統呼叫刪除測試案例 API，刪除完成後自動跳轉回該案例所屬專案之詳情頁面 `/project/:projectId`
