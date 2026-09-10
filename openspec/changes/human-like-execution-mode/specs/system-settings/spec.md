## ADDED Requirements

### Requirement: Global Execution Mode Persistence
系統全域設定 MUST 支援「執行模式 (executionMode)」配置，其值為 `"script"`（腳本模式）或 `"human"`（擬人模式），預設值 MUST 為 `"script"`。設定值 MUST 持久化於 PostgreSQL 資料庫的 `system_setting` 資料表中，並可透過 `GET /api/settings` 讀取與 `POST /api/settings` 更新。

#### Scenario: Read execution mode setting
- **WHEN** 前端發送 `GET /api/settings` 請求時
- **THEN** 後端 MUST 返回包含 `executionMode` 屬性（值為 `"script"` 或 `"human"`）的設定 JSON 物件，狀態碼為 200

#### Scenario: Update execution mode setting
- **WHEN** 前端發送 `POST /api/settings` 請求並傳入 `executionMode: "script"` 時
- **THEN** 後端 MUST 將設定更新至資料庫中並返回儲存成功

### Requirement: Vision Capability Enforcement for Human Mode
當系統全域設定之 `executionMode` 設定為 `"human"` 時，系統 MUST 強制要求 `aiConfig.executorModelId` 所對應的執行器模型具備多模態視覺能力。若欲切換為 `"human"` 模式但配置的模型不支援視覺（純文字模型），後端在儲存設定時 MUST 拒絕更新並回傳 400 錯誤；在啟動測試任務時，若當前為 `"human"` 模式但執行器模型不具備視覺能力，系統 MUST 阻止執行並拋出明確錯誤提示。

#### Scenario: Reject human execution mode when executor model lacks vision
- **WHEN** 使用者嘗試儲存設定並將 `executionMode` 設為 `"human"`，但所選的 `executorModelId` 為不支援視覺之純文字模型時
- **THEN** 後端 API MUST 拒絕儲存並回傳 400 狀態碼與明確錯誤訊息，要求使用者選擇具備視覺多模態能力之模型

#### Scenario: Abort test run if human mode has non-vision model
- **WHEN** 系統啟動測試運行且 `executionMode` 為 `"human"`，但 `executorModelSetting` 經檢驗不具備視覺多模態能力時
- **THEN** 後端 MUST 阻止任務啟動並將測試紀錄標記為失敗，錯誤訊息指出擬人模式必須使用具備視覺能力之模型
