## Context

在目前的 E2E 測試管理系統中，測試案例的詳情視圖頁面 [TestCaseDetailView.tsx](file:///c:/works/e2e-manager-ts/frontend/src/features/projects/pages/TestCaseDetailView.tsx) 面臨程式碼與 UI 高度耦合的問題。
現有的編輯卡片 `TestCaseEditBlock` 包含過多無關的編輯欄位，與專案層級採用的區塊化 FormBlock Bento 佈局不一致。
為了改善此問題，我們決定將該頁面的「步驟編輯」與「後設參數設定」進行徹底的分拆。

## Goals / Non-Goals

**Goals:**
- 將 `TestCaseDetailView` 擴展為 Steps (步驟)、History (歷史) 與 Setting (設定) 三個分頁。
- 將測試案例名稱、Storage (Cookies & LocalStorage)、環境變數 (Variables) 與刪除按鈕移至設定頁面。
- 將上述設定項封裝為四個獨立的 FormBlock 元件，以實現局部更新與獨立儲存。
- 簡化步驟編輯器 `TestCaseEditBlock`，使其只專注於測試步驟的自然語言與步驟預期結果編輯。

**Non-Goals:**
- 不修改後端的測試案例 API 定義，完全沿用現有的 `/api/testcases/:id`。
- 不改變專案 (Project) 或群組 (Group) 相關的 UI 與設定邏輯。
- 不修改 Playwright 測試執行器 (Runner) 與變數插值引擎。

## Decisions

### 1. 將設定分頁拆分為四個獨立儲存的 FormBlock 元件
* **決定**：在 `Setting` 分頁中，不使用單一的大表單來提交所有資料，而是將設定拆分為：
  - `TestCaseFormGeneralBlock` (編輯名稱)
  - `TestCaseFormStorageBlock` (編輯 Cookies/LocalStorage)
  - `TestCaseFormVariableBlock` (編輯環境變數)
  - `TestCaseFormDangerBlock` (刪除)
* **考量**：
  - **一致性**：這與專案設定頁中的 Project Form Blocks 設計完全一致，提供高度一致的 UI/UX。
  - **效能與驗證**：每個區塊各自具有獨立的 Zod validation，使用者可以輸入完 JSON 格式的 Cookies 隨即儲存，而不需擔心變數編輯區的格式影響該次儲存。

### 2. 獨立儲存的更新方式
* **決定**：每個 FormBlock 在儲存時，均直接呼叫 `api.updateTestcase(testCaseId, data)`，並只提交需要修改的欄位（或是從當前 state 合併其他未變動欄位）。
* **考量**：後端更新接口接收完整的 `Testcase` 或 partial 資料。在前端，當某個 Block 更新成功後，我們僅需局部更新 `TestCaseDetailView` 中維護的 `testcase` state，便能觸發整個 UI 的同步更新。

### 3. 重構 TestCaseEditBlock
* **決定**：不建立全新的步驟編輯元件，而是直接就地重構 [TestCaseEditBlock.tsx](file:///c:/works/e2e-manager-ts/frontend/src/features/projects/components/TestCaseEditBlock.tsx)。
* **考量**：該組件的步驟增減與 Switch 開關邏輯已非常健全。我們僅需刪除多餘的 UI markup（例如 JSONEditor、VariablesEditor 以及危險區域），並在 props 中移除不再需要的 props 即可，這能大幅降低程式碼變更與出錯的風險。

## Risks / Trade-offs

- **[Risk] 當使用者在 Setting 頁的某個 Block 編輯未存檔，就切換分頁或點選其他 Block 導致資料丟失**
  - **Mitigation**：由於 FormBlock 具有獨立的 `react-hook-form` 狀態，且 Tabs 設計在編輯模式下會被 disable (在 steps 分頁編輯時)。然而，在設定分頁中，各個 Block 都是並存的。我們將在每個 Block 提供清楚的「儲存」按鈕，且在 FormBlock 中加入 dirty state 提示（或使用 FormBlock 預設的按鈕禁用狀態，未修改時「儲存」按鈕不可點擊）。
