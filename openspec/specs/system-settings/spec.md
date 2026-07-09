# system-settings Specification

## Purpose
系統全域設定管理，提供 Playwright 執行參數與 AI 模型供應商的持久化配置，支援執行器（Executor）的 LLM 提供者配置。
## Requirements
### Requirement: System Global Settings Persistence
後端系統 MUST 提供全域設定的持久化儲存，將設定儲存於 PostgreSQL 資料庫 of `system_setting` 資料表中。後端 MUST 提供 API 路由 `GET /api/settings` 與 `POST /api/settings` 以供讀取與覆寫設定。設定內容除了基礎 Playwright 參數外，也 MUST 支援**執行器提供者（executorProvider）**之配置，並包含 Gemini API 金鑰、OpenAI Base URL、OpenAI API 金鑰、執行器模型名稱。後端讀取設定時，對於不包含 `executorProvider` 的舊設定資料，MUST 提供相容轉化機制（預設 fallback 至舊的 `provider` 欄位）。後端系統 MUST 提供 `DELETE /api/settings/history` 路由，一鍵清除資料庫中的所有 `TestRun` 執行紀錄與關聯日誌。

#### Scenario: Read global configurations with AI model parameters
- **WHEN** 前端發送 `GET /api/settings` 請求時
- **THEN** 後端 MUST 返回包含所有設定參數（包含 Playwright 參數、獨立的 executorProvider，以及執行器模型金鑰與名稱設定）的 JSON 物件，狀態碼為 200

#### Scenario: Update global configurations with AI model parameters
- **WHEN** 前端發送 `POST /api/settings` 請求並提供包含獨立 executorProvider 及模型名稱的參數值時
- **THEN** 後端 MUST 將新設定寫入並更新 PostgreSQL 資料庫中，並返回儲存成功訊息

### Requirement: Dynamic Playwright Parameters
後端 `BrowserManager` 初始化 Playwright 瀏覽器時，MUST 載入並套用設定中配置的參數，包括是否開啟無頭模式、Viewport 視窗尺寸、慢速 SlowMo 動作延遲與等待 Timeout 等設定，以動態改變測試執行時的瀏覽器表現。

#### Scenario: Launch Playwright with custom settings
- **WHEN** 後端啟動 E2E 測試任務並調用 `initBrowser` 時
- **THEN** 後端 `BrowserManager` 自動讀取並套用資料庫中的全域設定參數，開啟符合該設定的 Chromium 瀏覽器實例

### Requirement: Multi-provider LLM Configuration
系統核心在執行 E2E 測試決策（Executor）時，MUST 支援供應商（Google Gemini 與 OpenAI Compatible）配置。後端模型工廠 MUST 依據 `executorProvider` 的設定值實例化對應 of Executor 實例，系統 MUST 支援 Vision 多模態圖片輸入、Function/Tool Calling 瀏覽器工具呼叫，以及完整攔截並回傳統計的 Token 消耗數量。

#### Scenario: Execute test run using OpenAI Compatible executor
- **WHEN** 使用者將執行器設為 `openai` 並填妥金鑰且啟動測試案例執行時
- **THEN** 後端模型工廠實例化 `ChatOpenAI`（作為執行器），測試步驟能正常執行，且其 Token 數據能正常攔截並記錄

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

