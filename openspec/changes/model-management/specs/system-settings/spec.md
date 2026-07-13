## MODIFIED Requirements

### Requirement: System Global Settings Persistence
後端系統 MUST 提供全域設定的持久化儲存，將設定儲存於 PostgreSQL 資料庫的 `system_setting` 資料表中。後端 MUST 提供 API 路由 `GET /api/settings` 與 `POST /api/settings` 以供讀取與覆寫設定。設定內容除了基礎 Playwright 參數外，MUST 支援頂層的 `sendFailureScreenshot` 布林值（控制失敗截圖是否傳送給報告模型），以及 `aiConfig` 欄位，其結構改為以 ModelId 引用方式指定各 AI 角色（`executorModelId`、`reportModelId`），各角色的連線資訊（供應商、金鑰、模型名稱）由對應的 `ModelSetting` 記錄管理。後端系統 MUST 提供 `DELETE /api/settings/history` 路由，一鍵清除資料庫中的所有 `TestRun` 執行紀錄與關聯日誌。

#### Scenario: Read global configurations with AI model role references
- **WHEN** 前端發送 `GET /api/settings` 請求時
- **THEN** 後端 MUST 返回包含所有設定參數（包含 Playwright 參數、頂層 `sendFailureScreenshot`，以及 `aiConfig.executorModelId` 與 `aiConfig.reportModelId`）的 JSON 物件，狀態碼為 200

#### Scenario: Update global configurations with AI model role references
- **WHEN** 前端發送 `POST /api/settings` 請求並提供包含 `sendFailureScreenshot`、`aiConfig.executorModelId`、`aiConfig.reportModelId` 的參數時
- **THEN** 後端 MUST 將新設定寫入並更新 PostgreSQL 資料庫中，並返回儲存成功訊息

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
