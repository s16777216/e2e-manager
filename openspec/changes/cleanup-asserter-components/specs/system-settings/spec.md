## MODIFIED Requirements

### Requirement: System Global Settings Persistence
後端系統 MUST 提供全域設定的持久化儲存，將設定儲存於 PostgreSQL 資料庫 of `system_setting` 資料表中。後端 MUST 提供 API 路由 `GET /api/settings` 與 `POST /api/settings` 以供讀取與覆寫設定。設定內容除了基礎 Playwright 參數外，也 MUST 支援**執行器提供者（executorProvider）**之配置，並包含 Gemini API 金鑰、OpenAI Base URL、OpenAI API 金鑰、執行器模型名稱。後端讀取設定時，對於不包含 `executorProvider` 的舊設定資料，MUST 提供相容轉化機制（預設 fallback 至舊的 `provider` 欄位）。後端系統 MUST 提供 `DELETE /api/settings/history` 路由，一鍵清除資料庫中的所有 `TestRun` 執行紀錄與關聯日誌。

#### Scenario: Read global configurations with AI model parameters
- **WHEN** 前端發送 `GET /api/settings` 請求時
- **THEN** 後端 MUST 返回包含所有設定參數（包含 Playwright 參數、獨立的 executorProvider，以及執行器模型金鑰與名稱設定）的 JSON 物件，狀態碼為 200

#### Scenario: Update global configurations with AI model parameters
- **WHEN** 前端發送 `POST /api/settings` 請求並提供包含獨立 executorProvider 及模型名稱的參數值時
- **THEN** 後端 MUST 將新設定寫入並更新 PostgreSQL 資料庫中，並返回儲存成功訊息

### Requirement: Multi-provider LLM Configuration
系統核心在執行 E2E 測試決策（Executor）時，MUST 支援供應商（Google Gemini 與 OpenAI Compatible）配置。後端模型工廠 MUST 依據 `executorProvider` 的設定值實例化對應 of Executor 實例，系統 MUST 支援 Vision 多模態圖片輸入、Function/Tool Calling 瀏覽器工具呼叫，以及完整攔截並回傳統計的 Token 消耗數量。

#### Scenario: Execute test run using OpenAI Compatible executor
- **WHEN** 使用者將執行器設為 `openai` 並填妥金鑰且啟動測試案例執行時
- **THEN** 後端模型工廠實例化 `ChatOpenAI`（作為執行器），測試步驟能正常執行，且其 Token 數據能正常攔截並記錄
