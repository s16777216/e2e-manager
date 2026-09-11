# model-management Specification

## Purpose
提供獨立的 LLM 連線設定管理機制與 UI 頁面，支援多元 AI 模型參數的 CRUD 管理與角色引用刪除保護。

## Requirements
### Requirement: Model Setting CRUD Management
後端系統 MUST 提供獨立的 LLM 連線設定管理機制，將每個模型設定儲存於 `model_setting` 資料表中，以 UUID 為主鍵。每個 `ModelSetting` 記錄 MUST 包含以下欄位：`id`（UUID）、`name`（顯示名稱）、`description`（選填說明）、`provider`（`google` 或 `openai`）、`apiKey`（API 金鑰）、`baseUrl`（OpenAI Compatible Base URL，選填）、`model`（模型名稱）。後端 MUST 提供以下 API 路由：`GET /api/models`（列出所有模型）、`POST /api/models`（新增）、`PATCH /api/models/:id`（更新）、`DELETE /api/models/:id`（刪除，有引用保護）。

#### Scenario: Create a new model setting
- **WHEN** 前端發送 `POST /api/models` 並提供有效的模型設定資料時
- **THEN** 後端 MUST 建立新的 `ModelSetting` 記錄並以 UUID 為 id，回傳狀態碼 201 與新建立的記錄

#### Scenario: List all model settings
- **WHEN** 前端發送 `GET /api/models` 時
- **THEN** 後端 MUST 回傳所有 `ModelSetting` 記錄的陣列，狀態碼 200

#### Scenario: Update an existing model setting
- **WHEN** 前端發送 `PATCH /api/models/:id` 並提供更新資料時
- **THEN** 後端 MUST 更新對應的 `ModelSetting` 記錄並回傳更新後的資料，狀態碼 200

### Requirement: Model Deletion Protection
後端系統在刪除 `ModelSetting` 時，MUST 先查詢 `system_setting.aiConfig` 中所有 `xxxModelId` 欄位，若該模型 ID 正在被任一角色引用，MUST 拒絕刪除並回傳明確的錯誤訊息，告知使用者正在使用該模型的角色名稱。

#### Scenario: Delete unreferenced model setting
- **WHEN** 前端發送 `DELETE /api/models/:id` 且該模型未被任何角色引用時
- **THEN** 後端 MUST 刪除對應的 `ModelSetting` 並回傳狀態碼 204

#### Scenario: Reject deletion of referenced model setting
- **WHEN** 前端發送 `DELETE /api/models/:id` 且該模型正在被 `executorModelId` 或 `reportModelId` 引用時
- **THEN** 後端 MUST 回傳狀態碼 409 與錯誤訊息，說明該模型正被哪個角色使用，拒絕刪除操作

### Requirement: Model Management UI Page
前端 MUST 提供獨立的模型管理頁面（路由 `/models`），讓使用者以視覺化介面新增、編輯、刪除 LLM 連線設定。頁面 MUST 列出所有已建立的 `ModelSetting`，並支援刪除時顯示確認對話框，若後端回傳 409（引用保護）則顯示錯誤提示。
在新增或編輯模型表單中，當供應商（`provider`）選擇為「OpenAI Compatible」時，表單 MUST 即時展開並允許使用者編輯「Base URL」（`baseUrl`）欄位，且該欄位預設 placeholder 為 `http://localhost:11434/v1`；當供應商選擇為「Google Gemini」時，表單 MUST 隱藏 `baseUrl` 欄位。
在模型清單表格中，對於 OpenAI Compatible 模型，MUST 於供應商欄位中清晰呈現所設定之 `baseUrl`，以便使用者直接檢視其 API 端點。
#### Scenario: User creates a new model via UI
- **WHEN** 使用者在模型管理頁面填寫模型資料並提交時
- **THEN** 前端 MUST 發送 `POST /api/models` 請求，成功後刷新模型列表並顯示成功通知

#### Scenario: User attempts to delete a referenced model via UI
- **WHEN** 使用者點擊刪除按鈕並確認，但後端回傳 409 時
- **THEN** 前端 MUST 顯示錯誤訊息告知使用者該模型正在被使用，無法刪除

#### Scenario: User selects OpenAI Compatible provider in form
- **WHEN** 使用者在模型管理抽屜表單中切換供應商為「OpenAI Compatible」
- **THEN** 表單 MUST 即時動態渲染 `Base URL` 輸入框，並允許輸入自訂端點網址

#### Scenario: User edits an existing OpenAI Compatible model
- **WHEN** 使用者在模型清單中點擊任一已儲存之 OpenAI Compatible 模型的編輯按鈕
- **THEN** 抽屜表單開啟時 MUST 呈現「OpenAI Compatible」供應商，且 `Base URL` 輸入框 MUST 自動回填該模型既有之 `baseUrl` 設定值

#### Scenario: User views model list with OpenAI models
- **WHEN** 使用者瀏覽 `/models` 頁面且列表中包含 OpenAI Compatible 模型
- **THEN** 該模型之供應商欄位中 MUST 一併展示其設定之 `baseUrl` 資訊（若設定為空則顯示預設端點或提示）
