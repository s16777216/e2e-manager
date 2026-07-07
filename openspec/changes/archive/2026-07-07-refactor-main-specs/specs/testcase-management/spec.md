## ADDED Requirements

### Requirement: Project Creation View
系統 SHALL 提供專屬的專案建立頁面，路由路徑為 `/project/new`。該頁面 SHALL 渲染專案名稱、專案描述等輸入欄位。

#### Scenario: Navigate and create project
- **WHEN** 使用者於 `/project/new` 填寫有效的專案名稱並送出
- **THEN** 前端呼叫建立專案 API，建立成功後自動跳轉至該專案的詳情頁面 `/project/:projectId`

### Requirement: Project Edit View
系統 SHALL 提供專屬的專案編輯頁面，路由路徑為 `/project/:projectId/edit`。該頁面 SHALL 載入該專案的現有設定，並以區塊化卡片（Bento Card Settings）佈局分別展示基本資訊、Cookies 設定、LocalStorage 設定與危險區域。每個設定區塊 SHALL 包含就近的獨立儲存按鈕，支援局部資料提交與獨立的 JSON 驗證，儲存成功後頁面維持在編輯頁。

#### Scenario: Edit and save general settings
- **WHEN** 使用者修改專案名稱或描述，並點擊基本資訊區塊的儲存按鈕
- **THEN** 前端局部提交專案更新 API，提示儲存成功，且頁面維持在當前編輯頁

#### Scenario: Edit and save advanced environment settings
- **WHEN** 使用者在 Cookies 或 LocalStorage 區塊中輸入有效的 JSON 設定，並點擊該區塊的儲存按鈕
- **THEN** 前端僅對對應欄位提交更新 API，提示儲存成功，且頁面維持在當前編輯頁

#### Scenario: Delete project with verification
- **WHEN** 使用者於 `/project/:projectId/edit` 的危險區域卡片點擊刪除，並在 Dialog 中輸入與專案完全相同的名稱後點擊確定
- **THEN** 前端呼叫刪除專案 API，刪除完成後自動跳轉回專案列表首頁 `/project`

### Requirement: Project Detail View Group Item Count
在專案詳細頁面（Project Detail View）的樹狀表格中，群組（Test Group）的「子項目/步驟數」欄位在群組尚未展開前，也 SHALL 能夠顯示正確的子項目總數（包含子群組數量及測試案例數量之總和）。

#### Scenario: Display pre-calculated count before group expansion
- **WHEN** 載入專案詳細頁面且群組尚未展開時
- **THEN** 表格中群組的「子項目/步驟數」欄位顯示為其子群組數量與該群組所含測試案例數量的總和（大於等於 0），而不是預設顯示為 0。

### Requirement: Project List View Testcase Count
專案管理列表頁面（專案列表首頁）的表格中，各專案的「測試案例數」欄位 SHALL 顯示該專案旗下所有測試群組中所屬測試案例的加總數量。

#### Scenario: Display testcase count in project list
- **WHEN** 載入專案管理列表頁面時
- **THEN** 表格中每個專案的「測試案例數」欄位 SHALL 顯示為該專案旗下所有測試案例的加總數（大於等於 0）

### Requirement: TestCase Detail Page Layout
測試案例詳情頁面 SHALL 提供分頁標籤 (Tabs)，以區隔「測試步驟 (Steps)」與「執行歷史 (History)」的呈現，且當處於編輯模式下時，分頁標籤必須被禁用以防未存檔變更流失。

#### Scenario: Switching between steps and history tabs
- **WHEN** user clicks on the "Steps" or "History" tab
- **THEN** the system switches the main content area to display the corresponding view

### Requirement: TestCase Step and Parameter Editing
系統 SHALL 支援測試案例編輯模式，允許使用者修改「測試案例名稱」、「自然語言步驟清單（支援引用環境變數、動態增減步驟與切換步驟預期結果開關）」、「全域預期結果」以及「Cookies/LocalStorage」與「環境變數」設定。

#### Scenario: Saving test case edits
- **WHEN** user edits the fields in the form and clicks "Save"
- **THEN** the system calls the update API and refreshes the page content with the updated values

### Requirement: Deleting Test Case Confirmation
當使用者請求刪除測試案例時，系統 SHALL 顯示二次確認彈窗，要求使用者輸入該測試案例的完整名稱以解鎖確認按鈕，確認後才執行刪除。

#### Scenario: Deleting test case with matching confirmation name
- **WHEN** user types the exact name of the test case and clicks "Confirm Delete"
- **THEN** the system deletes the testcase and redirects to the project detail view

### Requirement: Interpolation engine supports JS expression evaluation
The system SHALL evaluate any text inside `{{}}` as a synchronous JavaScript expression if it does not strictly match a static variable name, or if it uses JS operators/calls. This evaluation MUST run in a restricted sandbox context using Node.js `vm`.

#### Scenario: Reference static variable in JS expression
- **WHEN** a step template contains `{{"Hello " + username}}` and `username` is `"John"`
- **THEN** the system evaluates the JS string concatenation and replaces the placeholder with `"Hello John"`

### Requirement: Safe execution sandbox with globals whitelist
The system MUST run JS expressions within a sandbox that has only a whitelist of safe globals. Access to Node.js system APIs such as `process`, `require`, `fs`, and `Buffer` MUST be prohibited.

#### Scenario: Prohibit access to process object
- **WHEN** a step template contains `{{process.exit(1)}}`
- **THEN** the system throws an evaluation exception because `process` is not defined or is inaccessible

### Requirement: Named snapshot caching via $vars Proxy
The system SHALL inject a `$vars` Proxy object into the sandbox. Writing to `$vars.<key>` saves a string representation into the current `RunContext`'s snapshot registry, and reading from it retrieves the cached value, allowing the `??=` operator to implement run-level caching.

#### Scenario: Define named snapshot with nullish coalescing
- **WHEN** the first step uses `{{$vars.tempId ??= crypto.randomUUID()}}`
- **THEN** the system generates a new UUID, stores it under snapshot key `tempId`, and returns it

### Requirement: Execution abort on evaluation failure
The system SHALL catch any JS syntax error, runtime exception, or timeout thrown during interpolation, abort the current TestRun execution immediately, and mark the TestRun as failed with an appropriate error log.

#### Scenario: Abort step execution on SyntaxError
- **WHEN** a step contains `{{Date.now(}}` (syntax error)
- **THEN** the interpolation engine throws an error, the task runner catches it, aborts execution, and updates the TestRun status to `failed`

### Requirement: Save block-level changes independently without data loss
The system SHALL save settings for individual configuration blocks (General, Storage, Variables) independently, and MUST NOT overwrite or clear variables or storage details when other blocks are modified and saved. The system's interpolation engine MUST accept an optional `RunContext` parameter on both `interpolateString` and `interpolateObject`. When no `RunContext` is supplied (existing callers), the behaviour is identical to the current implementation.

#### Scenario: Save general settings does not erase variables
- **WHEN** the user saves name or description changes in the General block
- **THEN** the system persists those details, and the environment variables in the database remain unchanged

### Requirement: JSON Test Script Validation Spec
系統 MUST 提供對 JSON 測試劇本的欄位結構驗證，驗證劇本必須包含非空的 `id`, `name`, `expected` 屬性，且 `steps` 屬性必須為包含至少一個非空字串的陣列。若輸入格式不符，系統 MUST 拋出具體的驗證錯誤。

#### Scenario: Parse JSON test script with empty steps array
- **WHEN** 系統解析一個 steps 屬性為空陣列 `[]` 的劇本 JSON 檔案
- **THEN** 系統拋出包含「步驟清單至少需包含一個步驟」描述的驗證失敗錯誤
