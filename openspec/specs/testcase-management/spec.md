# testcase-management Specification

## Purpose
TBD - created by archiving change router-layout-redesign. Update Purpose after archive.
## Requirements
### Requirement: TestCase Details and Edit View
系統 MUST 為每個測試案例提供獨立的詳細資訊與編輯頁面。該頁面 MUST 提供 Steps (步驟) 與 History (歷史執行紀錄) 分頁（Tabs）。在 Steps 分頁中，使用者 SHALL 可以檢視、編輯劇本名稱與預期結果，並且能動態新增、修改或刪除個別執行步驟。

#### Scenario: Manage and save testcase steps
- **WHEN** 使用者在測試案例詳情頁的 Steps 分頁編輯名稱、預期結果並點擊「新增下一步」新增自然語言步驟後保存
- **THEN** 前端將修改後的測試案例資料傳送至 API `/api/testcases/:id` 進行儲存，並提示儲存成功，頁面同步更新最新步驟

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

