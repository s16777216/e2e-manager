## MODIFIED Requirements

### Requirement: System Global Settings Persistence
後端系統 MUST 提供全域設定的持久化儲存，將設定儲存於 PostgreSQL 資料庫 of `system_setting` 資料表中。後端 MUST 提供 API 路由 `GET /api/settings` 與 `POST /api/settings` 以供讀取與覆寫設定。設定內容除了基礎 Playwright 參數外，也 MUST 支援**執行器提供者（executorProvider）**、**失敗總結器提供者（provider）**、**執行器與總結器各自獨立之模型名稱**與**是否傳送失敗截圖（sendFailureScreenshot）**之配置，並包含 Gemini API 金鑰、OpenAI Base URL、OpenAI API 金鑰。後端讀取設定時，對於不包含 `executorProvider` 的舊設定資料，MUST 提供相容轉化機制（預設 fallback 至舊的 `provider` 欄位）。後端系統 MUST 提供 `DELETE /api/settings/history` 路由，一鍵清除資料庫中的所有 `TestRun` 執行紀錄與關聯日誌。

#### Scenario: Read global configurations with AI model parameters
- **WHEN** 前端發送 `GET /api/settings` 請求時
- **THEN** 後端 MUST 返回包含所有設定參數（包含 Playwright 參數、獨立的 executorProvider 與 provider、sendFailureScreenshot，以及執行器與失敗總結器各自獨立之模型名稱與金鑰參數）的 JSON 物件，狀態碼為 200

#### Scenario: Update global configurations with AI model parameters
- **WHEN** 前端發送 `POST /api/settings` 請求並提供包含獨立 executorProvider、provider、sendFailureScreenshot 及對應各自獨立模型名稱與金鑰參數值時
- **THEN** 後端 MUST 將新設定寫入並更新 PostgreSQL 資料庫中，並返回儲存成功訊息
