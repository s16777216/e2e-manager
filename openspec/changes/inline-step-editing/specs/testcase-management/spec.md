## MODIFIED Requirements

### Requirement: TestCase Details and Edit View
系統 MUST 為每個測試案例提供獨立的詳細資訊與編輯頁面。該頁面 MUST 提供 Steps (步驟)、History (歷史執行紀錄) 與 Setting (設定) 分頁（Tabs）。在 Steps 分頁中，使用者僅能檢視與透過「行內編輯」來調整測試案例步驟與最終預期結果。

#### Scenario: Inline edit testcase step
- **WHEN** 使用者滑鼠懸停至某步驟上並點選該項目右側的「編輯」符號
- **THEN** 該步驟項目就地展開為編輯框，其餘步驟維持唯讀狀態

#### Scenario: Switch to setting tab
- **WHEN** 使用者點擊進入 Setting 分頁
- **THEN** 前端展示該測試案例的所有配置區塊 (基本資訊、Storage設定、環境變數、危險區域)

### Requirement: TestCase Step and Parameter Editing
系統 SHALL 支援測試案例步驟的行內編輯與參數設定。步驟編輯允許以行內就地編輯的方式單獨儲存、刪除或移動步驟；新增步驟時前端先建立空白暫存項目，於該項目點擊儲存時才寫入資料庫。

#### Scenario: Saving test case step edits inline
- **WHEN** 使用者在某步驟編輯框中修改內容並點擊「儲存」
- **THEN** 系統更新對應 index 步驟並呼叫 API 儲存整組 steps，成功後該項目變回唯讀

#### Scenario: Adding step on client side
- **WHEN** 使用者在步驟列表下方點擊「新增步驟」
- **THEN** 系統在前端 steps 陣列末尾追加空白步驟，並自動令其進入行內編輯模式，此時不呼叫 API

#### Scenario: Canceling unsaved new step
- **WHEN** 使用者在剛新增的空白步驟上點選「取消」
- **THEN** 系統直接在前端將該空白項目移除，不觸發 API 呼叫

#### Scenario: Saving test case name in setting block
- **WHEN** 使用者在 Setting 分頁的基本資訊 block 中修改名稱並點擊儲存
- **THEN** 系統局部提交更新 API 變更測試案例名稱，且頁面維持在當前設定頁

#### Scenario: Saving test case storage in setting block
- **WHEN** 使用者在 Setting 分頁的 Storage 設定 block 中修改 Cookies 或 LocalStorage 並點擊儲存
- **THEN** 系統局部提交更新 API 變更對應的 JSON 資料，且頁面維持在當前設定頁

#### Scenario: Saving test case variables in setting block
- **WHEN** 使用者在 Setting 分頁的環境變數 block 中修改變數對應表並點擊儲存
- **THEN** 系統局部提交更新 API 變更環境變數配置，且頁面維持在當前設定頁
