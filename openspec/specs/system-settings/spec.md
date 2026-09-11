# system-settings Specification

## Purpose
系統全域設定管理，提供 Playwright 執行參數與 AI 模型供應商的持久化配置，支援執行器（Executor）的 LLM 提供者配置。
## Requirements
### Requirement: System Global Settings Persistence
後端系統 MUST 提供全域設定的持久化儲存，將設定儲存於 PostgreSQL 資料庫的 `system_setting` 資料表中。後端 MUST 提供 API 路由 `GET /api/settings` 與 `POST /api/settings` 以供讀取與覆寫設定。設定內容除了基礎 Playwright 參數外，MUST 支援頂層的 `sendFailureScreenshot` 布林值（控制失敗截圖是否傳送給報告模型），以及 `aiConfig` 欄位，其結構改為以 ModelId 引用方式指定各 AI 角色（`executorModelId`、`reportModelId`），各角色的連線資訊（供應商、金鑰、模型名稱）由對應的 `ModelSetting` 記錄管理。後端系統 MUST 提供 `DELETE /api/settings/history` 路由，一鍵清除資料庫中的所有 `TestRun` 執行紀錄與關聯日誌。

#### Scenario: Read global configurations with AI model role references
- **WHEN** 前端發送 `GET /api/settings` 請求時
- **THEN** 後端 MUST 返回包含所有設定參數（包含 Playwright 參數、頂層 `sendFailureScreenshot`，以及 `aiConfig.executorModelId` 與 `aiConfig.reportModelId`）的 JSON 物件，狀態碼為 200

#### Scenario: Update global configurations with AI model role references
- **WHEN** 前端發送 `POST /api/settings` 請求並提供包含 `sendFailureScreenshot`、`aiConfig.executorModelId`、`aiConfig.reportModelId` 的參數時
- **THEN** 後端 MUST 將新設定寫入並更新 PostgreSQL 資料庫中，並返回儲存成功訊息

### Requirement: Dynamic Playwright Parameters
後端 `BrowserManager` 初始化 Playwright 瀏覽器時，MUST 載入並套用設定中配置的參數，包括是否開啟無頭模式、Viewport 視窗尺寸、慢速 SlowMo 動作延遲與等待 Timeout 等設定，以動態改變測試執行時的瀏覽器表現。

#### Scenario: Launch Playwright with custom settings
- **WHEN** 後端啟動 E2E 測試任務並調用 `initBrowser` 時
- **THEN** 後端 `BrowserManager` 自動讀取並套用資料庫中的全域設定參數，開啟符合該設定的 Chromium 瀏覽器實例

### Requirement: Multi-provider LLM Configuration
系統在執行 E2E 測試決策（Executor）時，MUST 依據 `aiConfig.executorModelId` 查詢對應的 `ModelSetting` 記錄，並使用其供應商與連線資訊實例化 LLM。若 `executorModelId` 未設定或對應的 `ModelSetting` 不存在，系統 MUST 拒絕執行並回傳明確錯誤訊息。失敗總結器（Report Model）MUST 依據 `aiConfig.reportModelId` 查詢對應的 `ModelSetting`；若 `reportModelId` 未設定或對應模型不存在，MUST 跳過報告生成步驟（不得 fallback 至執行器模型）。

#### Scenario: Execute test run using configured executor model
- **WHEN** 使用者啟動測試案例執行，且 `executorModelId` 指向一個存在的 `ModelSetting` 時
- **THEN** 後端模型工廠 MUST 依據該 `ModelSetting` 的 provider 實例化對應的 LLM（Google 或 OpenAI Compatible），並正常執行測試步驟

#### Scenario: Reject test execution when executor model is not configured
- **WHEN** 使用者啟動測試案例執行，但 `executorModelId` 為空或對應的 `ModelSetting` 不存在時
- **THEN** 後端 MUST 拒絕執行並回傳錯誤訊息，提示使用者前往系統設定配置執行器模型

#### Scenario: Skip report generation when report model is not configured
- **WHEN** 測試案例執行失敗，且 `reportModelId` 未設定或對應的 `ModelSetting` 不存在時
- **THEN** 後端 MUST 跳過失敗報告生成步驟，不得嘗試 fallback 至執行器模型，測試運行下線時 `failureSummary` 為空

### Requirement: SlowMo and Timeout Validation
系統設定中，動作延遲 (slowMo) 屬性 MUST 為介於 0 到 3000ms 之間的數值，且預設等待超時 (defaultTimeout) MUST 為不小於 1000ms 的數值。

#### Scenario: slowMo 數值過大校驗
- **WHEN** 使用者輸入的動作延遲大於 3000
- **THEN** 系統 SHALL 阻擋表單提交，並在畫面上顯示「動作延遲不能超過 3000ms」的提示

#### Scenario: defaultTimeout 數值過小校驗
- **WHEN** 使用者輸入的預設等待超時小於 1000
- **THEN** 系統 SHALL 阻擋表單提交，並在畫面上顯示「超時時間至少需 1000ms」的提示

### Requirement: Viewport Width and Height Validation
系統設定中，瀏覽器視窗寬度 (viewportWidth) MUST 為介於 320 到 3840 之間的數值，且視窗高度 (viewportHeight) MUST 為介於 240 到 2160 之間的數值。

#### Scenario: 視窗寬度過小校驗
- **WHEN** 使用者輸入的寬度小於 320
- **THEN** 系統 SHALL 阻擋表單提交，並在畫面上顯示「寬度至少為 320」的提示

#### Scenario: 視窗高度過大校驗
- **WHEN** 使用者輸入的高度大於 2160
- **THEN** 系統 SHALL 阻擋表單提交，並在畫面上顯示「高度最大為 2160」的提示

### Requirement: Screenshot Retention Setting and Automatic Cleanup
後端系統 MUST 支援全域的「截圖保留天數」設定，並將其持久化儲存於 `SystemSetting` 中。系統啟動與背景執行 Worker 時，MUST 依此設定自動比對資料庫紀錄，將過期 `TestRun` 與 `TestRunStep` 的二進位截圖數據清空（設為 NULL）以釋放空間，同時維持測試統計之中繼數據不被刪除。

#### Scenario: Configure and save screenshot retention days
- **WHEN** 前端發送 `POST /api/settings` 包含 `screenshotRetentionDays` 參數且大於等於 0 時
- **THEN** 後端 MUST 將新設定存入 `SystemSetting` 資料庫中，並回傳儲存成功訊息

#### Scenario: Automatically clear expired screenshots
- **WHEN** 背景自動清理服務執行，且資料庫中存在建立時間超過保留天數的截圖數據時
- **THEN** 後端 MUST 將這些過期紀錄的 `screenshotData` 與 `screenshotFailData` 二進位欄位更替為 NULL，並將其對應狀態設為 expired

### Requirement: Explicit Screenshot Status Mapping
系統在執行測試與執行過期清理時，MUST 透過 `screenshotStatus`（步驟）與 `screenshotFailStatus`（運行）明確記錄截圖可用狀態，以便前端介面能精確區分「正常顯示」、「此步驟無截圖」與「此截圖已過期清理」，避免圖片載入破圖。

#### Scenario: Update screenshot status to available on success
- **WHEN** 測試執行成功擷取截圖並寫入資料庫時
- **THEN** 系統 MUST 將該步驟的 `screenshotStatus`（或該次運行的 `screenshotFailStatus`）更新為 available

#### Scenario: Render expired placeholder in frontend
- **WHEN** 前端載入詳細步驟且該步驟之 `screenshotStatus` 屬性為 expired 時
- **THEN** 前端 MUST 渲染時鐘圖示與說明文字「此步驟之截圖已過期清理」，且不發送圖片載入請求與顯示破圖


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
