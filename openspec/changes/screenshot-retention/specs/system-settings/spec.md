## ADDED Requirements

### Requirement: Screenshot Retention Setting and Automatic Cleanup
後端系統 MUST 支援全域的「截圖保留天數」設定，並將其持久化儲存於 `SystemSetting` 中。系統啟動與背景執行 Worker 時，MUST 依此設定自動比對資料庫紀錄，將過期 `TestRun` 與 `TestRunStep` 的二進位截圖數據清空（設為 NULL）以釋放空間，同時維持測試統計之中繼數據不被刪除。

#### Scenario: Configure and save screenshot retention days
- **WHEN** 前端發送 `POST /api/settings` 包含 `screenshotRetentionDays` 參數且大於等於 0 時
- **THEN** 後端 MUST 將新設定存入 `SystemSetting` 資料庫中，並回傳儲存成功訊息

#### Scenario: Automatically clear expired screenshots with batch LIMIT
- **WHEN** 背景自動清理服務執行，且資料庫中存在建立時間超過保留天數的截圖數據時
- **THEN** 後端 MUST 分批處理（每批 LIMIT 500），將這些過期紀錄的 `screenshotData` 與 `screenshotFailData` 二進位欄位更替為 NULL，並將其對應狀態設為 `expired`

#### Scenario: Daily cleanup frequency control
- **WHEN** Worker 輪詢週期到達，且距離上次成功清理 (`lastCleanupAt`) 超過 24 小時
- **THEN** 系統 MUST 執行清理邏輯並更新 `lastCleanupAt`；若未超過 24 小時則跳過

#### Scenario: Zero retention days means never cleanup
- **WHEN** `screenshotRetentionDays` 設為 0
- **THEN** 系統 MUST 不執行任何自動清理，截圖永久保留

### Requirement: Explicit Screenshot Status Mapping
系統在執行測試與執行過期清理時，MUST 透過 `screenshotStatus`（步驟）與 `screenshotFailStatus`（運行）明確記錄截圖可用狀態，以便前端介面能精確區分「正常顯示」、「此步驟無截圖」與「此截圖已過期清理」，避免圖片載入破圖。

#### Scenario: Update screenshot status to available on success
- **WHEN** 測試執行成功擷取截圖並寫入資料庫時
- **THEN** 系統 MUST 將該步驟的 `screenshotStatus`（或該次運行的 `screenshotFailStatus`）更新為 `available`

#### Scenario: Frontend hides expired screenshots completely
- **WHEN** 前端載入詳細步驟且該步驟之 `screenshotStatus` 屬性為 `expired` 時
- **THEN** 前端 MUST **完全不渲染**該步驟的截圖區塊（不顯示佔位符、不佔版面、不發送圖片載入請求）

#### Scenario: Frontend renders available screenshots normally
- **WHEN** 前端載入步驟且 `screenshotStatus` 為 `available` 時
- **THEN** 前端 MUST 正常顯示截圖縮圖與點擊放大功能

#### Scenario: Frontend shows nothing for none status
- **WHEN** 前端載入步驟且 `screenshotStatus` 為 `none` 時
- **THEN** 前端 MUST 不顯示截圖區塊（維持現有行為）