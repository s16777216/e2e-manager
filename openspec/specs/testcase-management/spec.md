# testcase-management Specification

## Purpose
測試劇本與變數管理，整合動態變數、專案/群組/案例環境變數繼承與合併、JS 表示式沙箱求值、專案與案例編輯視圖、樹狀表格項目計數及 JSON 格式校驗規格。

## Requirements
### Requirement: TestCase Details and Edit View
系統 MUST 為每個測試案例提供獨立的詳細資訊與編輯頁面。該頁面 MUST 提供 Steps (步驟)、History (歷史執行紀錄) 與 Setting (設定) 分頁（Tabs）。在 Steps 分頁中，使用者僅能檢視與透過「行內編輯」來調整測試案例步驟與最終預期結果。

#### Scenario: Inline edit testcase step
- **WHEN** 使用者滑鼠懸停至某步驟上並點選該項目右側的「編輯」符號
- **THEN** 該步驟項目就地展開為編輯框，其餘步驟維持唯讀狀態

#### Scenario: Switch to setting tab
- **WHEN** 使用者點擊進入 Setting 分頁
- **THEN** 前端展示該測試案例的所有配置區塊 (基本資訊、Storage設定、環境變數、危險區域)

### Requirement: TestCase Run History List
系統 MUST 在測試案例的 History 分頁中，列出該測試案例過去的所有執行任務。列表 MUST 顯示每次執行的狀態、啟動時間與結束時間，點擊特定任務 SHALL 可 navigate 跳轉至對應的即時監控 Console 頁面。

#### Scenario: View past runs and navigate
- **WHEN** 使用者點擊進入 History 分頁，且該測試案例存在歷史執行資料
- **THEN** 前端展示所有歷史執行卡片，並在點擊其中一筆執行紀錄時，將頁面導航至 `/project/:projectId/run/:runId`

### Requirement: Multi-level Environment Setting DB Support
系統 MUST 在 `Project`、`TestGroup` 與 `Testcase` 的資料結構中皆支援 `initCookies` (以網域路徑為 Key 的 JSON 物件) 與 `initLocalStorage` (JSON 物件) 屬性。

#### Scenario: Database schema and API transmission
- **WHEN** 查詢或更新專案、群組、測試案例詳情時
- **THEN** API 回傳的資料結構中 SHALL 包含對應的 `initCookies` 與 `initLocalStorage` 欄位，兩者皆為 JSON 鍵值對物件格式

### Requirement: Inheritance and Merging of Environment Settings
系統在執行測試案例時，MUST 將專案、群組（含父群組）與測試案例的 `initCookies` 與 `initLocalStorage` 沿著繼承鏈進行合併。

#### Scenario: Playwright execution with merged settings
- **WHEN** 執行測試案例且該案例所屬的專案或群組有設定預置環境時
- **THEN** 後端 Playwright 執行器依 `Project -> Group -> Testcase` 優先權，將 Cookie 進行雙層深度合併，將 LocalStorage 進行淺合併，並將解析後符合 Playwright 規格的資料注入瀏覽器 Context 中

### Requirement: Multi-level Testcase Variable Storage
系統 MUST 在 `Project`、`TestGroup` 與 `Testcase` 的實體中，皆支援 `variables` 屬性（格式為 JSONB 鍵值對 `Record<string, string>`），以儲存自訂環境變數。

#### Scenario: Database schema and API transmission for variables
- **WHEN** 查詢或更新專案、群組或測試案例詳情時
- **THEN** API 回傳的資料結構中 SHALL 包含對應的 `variables` 欄位

### Requirement: Variable Interpolation Engine
系統在執行測試案例前，MUST 將專案、群組與測試案例的 `variables` 沿繼承鏈（`Project -> Group -> Testcase`）進行淺合併，並將測試案例的 `steps` 陣列、`expected`、`initCookies` 與 `initLocalStorage` 中所有的 `{{variableName}}` 預留位置，替換為對應的變數真實值。

#### Scenario: Playwright execution with interpolated variables
- **WHEN** 執行測試案例，且該測試案例的步驟中包含 `{{baseUrl}}` 等變數預留位置時
- **THEN** 後端在執行前，自動在記憶體中將該步驟替換為真實的值，並交付給 Playwright 與 AI Agent 執行

### Requirement: Testcase Last Run Status Display
系統在專案詳情頁面的測試案例列表中，MUST 顯示該測試案例最後一次執行的狀態。該狀態 MUST 正確反映所有歷史執行（TestRun）中，依據時間（createdAt）排序最新的執行結果。

#### Scenario: Display latest status correctly
- **WHEN** 測試案例存在多筆歷史執行紀錄且包含不同的狀態
- **THEN** 專案詳情頁面的列表中，該測試案例的執行狀態欄位 SHALL 顯示時間最新（最晚建立）的那一筆執行的狀態

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
系統 SHALL 支援測試案例步驟的行內編輯與參數設定。步驟編輯允許以行內就地編輯的方式單獨儲存、刪除或移動步驟；新增步驟時前端先建立空白暫存項目，於該項目點擊儲存時才寫入資料庫。

#### Scenario: Saving test case step edits inline
- **WHEN** 使用者在某步驟編輯框中修改內容並點擊「儲存」
- **THEN** 系統更新對應 index 步驟並呼叫 API 儲存整組 steps，成功後該項目變回唯讀

#### Scenario: Adding step on client side
- **WHEN** 使用者在步驟列表下方點擊「新增步驟」
- **THEN** 系統在前端 steps 陣列末尾追加空白步驟，並自動令其進入行內編輯模式，此時不呼叫 API

#### Scenario: Canceling unsaved new step
- **WHEN** 使用者在剛新增的空白步驟上點選「取消」
- **THEN** 系統直接在前端將該空白項目移除，不觸發 API 呼叫

#### Scenario: Saving test case name in setting block
- **WHEN** 使用者在 Setting 分頁的基本資訊 block 中修改名稱並點擊儲存
- **THEN** 系統局部提交更新 API 變更測試案例名稱，且頁面維持在當前設定頁

#### Scenario: Saving test case storage in setting block
- **WHEN** 使用者在 Setting 分頁的 Storage 設定 block 中修改 Cookies 或 LocalStorage 並點擊儲存
- **THEN** 系統局部提交更新 API 變更對應的 JSON 資料，且頁面維持在當前設定頁

#### Scenario: Saving test case variables in setting block
- **WHEN** 使用者在 Setting 分頁的環境變數 block 中修改變數對應表並點擊儲存
- **THEN** 系統局部提交更新 API 變更環境變數配置，且頁面維持在當前設定頁

### Requirement: Deleting Test Case Confirmation
當使用者請求刪除測試案例時，系統 SHALL 顯示二次確認彈窗，要求使用者輸入該測試案例的完整名稱以解鎖確認按鈕，確認後才執行刪除。該刪除入口 MUST 放置於 Setting 分頁的危險區域 (Danger Zone) FormBlock 中。

#### Scenario: Deleting test case with matching confirmation name
- **WHEN** 使用者在 Setting 分頁的危險區域點擊刪除專案按鈕，在 Dialog 中輸入與該測試案例完全相同的名稱後點擊確定
- **THEN** 系統呼叫刪除測試案例 API，刪除完成後自動跳轉回該案例所屬專案之詳情頁面 `/project/:projectId`

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

### Requirement: Multi-level System Prompt Database Persistence
The system SHALL support storing `systemPrompt` (type text, nullable) inside the `Project`, `TestGroup`, and `Testcase` entities.

#### Scenario: Database schema and API transmission for system prompts
- **WHEN** querying or patching details for projects, groups, or testcases via the backend API
- **THEN** the JSON response SHALL include the `systemPrompt` property corresponding to the saved database state

### Requirement: Frontend Interface for Configuring System Prompts
The system SHALL provide textarea input fields in the Project Settings, Group Edit Sheet, and Testcase Edit Block to allow users to specify and modify the `systemPrompt`.

#### Scenario: User saves project-level prompt
- **WHEN** the user inputs a custom UI guide in the Project Settings Page and clicks save
- **THEN** the frontend sends a PATCH request with the updated `systemPrompt` to the API and displays a success toast message

