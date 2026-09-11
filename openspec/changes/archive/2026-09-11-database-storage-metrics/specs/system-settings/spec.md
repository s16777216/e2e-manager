## ADDED Requirements

### Requirement: Database Storage Metrics API
後端系統 MUST 提供 `GET /api/settings/storage` 路由以回傳 PostgreSQL 資料庫之多維度儲存空間統計資訊。
回傳內容 MUST 包含：
1. **整體資料庫空間**：包含位元組數值（`databaseSizeBytes`）與人類可讀字串（`databaseSize`，如 `"142.5 MB"`）。
2. **截圖佔用分析**：包含步驟截圖實際二進位位元組總和（`screenshots.sizeBytes`）、人類可讀字串（`screenshots.size`）、截圖總張數（`screenshots.count`）與截圖佔總資料庫容量之百分比（`screenshots.percentage`）。
3. **主要資料表實體排行**：列出 `test_run_step`、`test_log`、`test_run` 等關鍵表格的磁碟總佔用（含關聯 TOAST 與索引大小）。

#### Scenario: Retrieve database storage metrics successfully
- **WHEN** 前端發送 `GET /api/settings/storage` 請求時
- **THEN** 後端 MUST 透過 PostgreSQL 系統函數與資料庫查詢，計算並返回狀態碼 200 及結構化的儲存空間統計 JSON 資料

#### Scenario: Handle database query error gracefully
- **WHEN** 查詢儲存空間過程中發生資料庫異常或超時
- **THEN** 後端 MUST 返回狀態碼 500 並包含明確的錯誤訊息

---

### Requirement: Storage Metrics Dashboard Card
前端「系統設定」頁面 MUST 提供「儲存空間與資料庫狀態」監控卡片。
卡片 MUST 呈現：
1. 資料庫總實體容量與格式化數值。
2. 步驟截圖二進位佔用空間、截圖總張數及佔比百分比。
3. 儲存空間分佈進度條（截圖佔用 vs 日誌與中繼資料）。
4. 「重新整理」按鈕，允許使用者手動觸發重新抓取最新資料庫水位。

#### Scenario: View storage metrics in settings view
- **WHEN** 使用者載入或瀏覽「系統設定」頁面時
- **THEN** 系統自動取得最新儲存指標，並於儲存監控卡片上渲染總容量、截圖數據與空間佔比進度條

#### Scenario: Refresh storage metrics manually
- **WHEN** 使用者點擊儲存監控卡片上的「重新整理」按鈕
- **THEN** 前端顯示載入動畫並重新向後端請求 `/api/settings/storage`，更新畫面上的數據指標
