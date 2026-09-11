## MODIFIED Requirements

### Requirement: Model Management UI Page
前端 MUST 提供獨立的模型管理頁面（路由 `/models`），讓使用者以視覺化介面新增、編輯、刪除 LLM 連線設定。
在新增或編輯模型表單中，當供應商（`provider`）選擇為「OpenAI Compatible」時，表單 MUST 即時展開並允許使用者編輯「Base URL」（`baseUrl`）欄位，且該欄位預設 placeholder 為 `http://localhost:11434/v1`；當供應商選擇為「Google Gemini」時，表單 MUST 隱藏 `baseUrl` 欄位。
在模型清單表格中，對於 OpenAI Compatible 模型，MUST 於供應商欄位中清晰呈現所設定之 `baseUrl`，以便使用者直接檢視其 API 端點。

#### Scenario: User selects OpenAI Compatible provider in form
- **WHEN** 使用者在模型管理抽屜表單中切換供應商為「OpenAI Compatible」
- **THEN** 表單 MUST 即時動態渲染 `Base URL` 輸入框，並允許輸入自訂端點網址

#### Scenario: User edits an existing OpenAI Compatible model
- **WHEN** 使用者在模型清單中點擊任一已儲存之 OpenAI Compatible 模型的編輯按鈕
- **THEN** 抽屜表單開啟時 MUST 呈現「OpenAI Compatible」供應商，且 `Base URL` 輸入框 MUST 自動回填該模型既有之 `baseUrl` 設定值

#### Scenario: User views model list with OpenAI models
- **WHEN** 使用者瀏覽 `/models` 頁面且列表中包含 OpenAI Compatible 模型
- **THEN** 該模型之供應商欄位中 MUST 一併展示其設定之 `baseUrl` 資訊（若設定為空則顯示預設端點或提示）
