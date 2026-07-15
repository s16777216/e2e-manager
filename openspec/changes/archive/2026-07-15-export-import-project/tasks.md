## 1. 後端 Data Models & Helper Functions (Backend Services)

- [x] 1.1 於 `backend/src/services/exportImportService.ts` 完善 `exportProjectData(projectId: string)` 函式：遞迴查詢指定 Project 及其所有 TestGroups、Testcases 與 TestcaseSteps，包含擴充設定欄位（`systemPrompt`, `variables`, `initCookies`, `initLocalStorage`, `disableParentPrompt`），過濾掉所有內置 ID（如 UUID）、時間戳記、TestRuns、TestLogs，組裝為標準 `ExportProjectPayload` 物件。
- [x] 1.2 於 `exportImportService.ts` 實作 `previewImportData(jsonPayload: any)` 函式：驗證 `$schemaVersion` 與結構合法性；查詢資料庫是否存在同名 Project 並自動產出 `suggestedName`；計算統計數據（總 Group 數、總 Case 數、總 Step 數）；組裝帶有 `tempId` 的完整階層樹狀 Preview 結構以供前端選取。
- [x] 1.3 於 `exportImportService.ts` 實作 `executeImportProject(data: ImportConfirmPayload)` 函式：開啟 TypeORM 資料庫 Transaction；根據使用者傳入的 `selectedItems` 剔除未勾選之項目；遞迴建立新 `Project`、`TestGroup`（維持 parent 關聯）、`Testcase` 及 `TestcaseStep`；確保寫入過程異常時觸發完整 Rollback。

## 2. 後端 API Routes 實作 (Backend API Endpoints)

- [x] 2.1 於 `backend/src/routes/exportImport.ts` 確保 3 個路由運作正常：`GET /:id/export`, `POST /import/preview`, `POST /import`。
- [x] 2.2 實作 `GET /:id/export` 路由：呼叫 `exportProjectData`，發送包含 HTTP Header `Content-Disposition: attachment; filename="project-export.json"` 的 JSON 下載響應。
- [x] 2.3 實作 `POST /import/preview` 路由：接受上傳的 JSON 檔案（經由 multer 中間件處理）或 JSON Request Body，呼叫 `previewImportData`，回傳預覽資訊與格式校驗結果。
- [x] 2.4 實作 `POST /import` 路由：接受 `ImportConfirmPayload`，呼叫 `executeImportProject` 完成寫入，回傳 HTTP 201 與新建專案 ID。
- [x] 2.5 於 `backend/src/server.ts` 確認註冊路由 `/api/export-import`。

## 3. 前端 API 串接與路由設定 (Frontend API Services & Routing)

- [x] 3.1 於 `frontend/src/routes.tsx` 註冊獨立頁面路由 `/projects/import`，指向 `ProjectImportView` 元件。
- [x] 3.2 於 `frontend/src/lib/api.ts` 確保 `exportProject` 指向正確的後端路徑 `${BASE_URL}/export-import/${projectId}/export`。
- [x] 3.3 於 `frontend/src/lib/api.ts` 新增 `previewImportProject(file: File)` 檔案發送至後端預覽 API 的請求函式。
- [x] 3.4 於 `frontend/src/lib/api.ts` 新增 `confirmImportProject(payload: ImportConfirmPayload)` 發送最後確定的匯入請求函式。

## 4. 前端獨立頁面與編輯頁備份區塊 UI (Frontend UI Implementation)

- [x] 4.1 修正與完善 `frontend/src/features/projects/components/ProjectFormExportBlock.tsx` 專案備份區塊：
  - 將匯出請求升級為非同步 fetch + `Loader2` 轉圈 Spinner + Toast 即時反饋。
  - 對齊專案 Bento/Zinc 深色主題風格 (暗黑底色、質感邊框與按鈕)。
  - 放置於 `ProjectEditView.tsx` 的危險區域正上方。
- [x] 4.2 完善獨立頁面元件 `frontend/src/views/ProjectImportView.tsx` (路由 `/projects/import`)：
  - 對齊整體專案 Bento/Zinc 暗黑主題 (`bg-zinc-950`)。
  - 實作檔案選取與拖曳上傳區 (Dropzone)，上傳後呼叫預覽 API 載入資料。
  - 實作專案基本屬性表單（名稱與描述修改）。
  - 實作階層樹狀勾選清單 (Checkbox Tree)，連結 `selectedItems` 狀態，包含搜尋關鍵字過濾框、[全選]、[全部取消] 控制按鈕。
  - 實作勾選連動邏輯：勾選/取消勾選父 Group 時連動子項目；選取子 Testcase 時自動保證父 Group 被勾選。
  - 實作確認匯入流程：點擊「開始匯入專案」送出數據，成功後顯示 Toast 並跳轉引導至新專案頁面 `/projects/:newProjectId`。
- [x] 4.3 於專案列表視圖 (Project List Page) 新增「匯入專案」按鈕，點擊觸發導頁至 `/projects/import`。

## 5. 驗證與閉環測試 (Verification)

- [x] 5.1 手動或寫測試案例驗證專案匯出：在專案編輯頁點擊「匯出 JSON」，檢查下載的 JSON 檔案格式是否包含完整屬性（Prompt, Variables 等），且不包含舊 UUID 與 TestRuns。
- [x] 5.2 驗證 `/projects/import` 獨立頁面預覽：上傳壞掉的 JSON 驗證 400 錯誤；上傳正常 JSON 驗證 `suggestedName` 重複處理與階層搜尋過濾。
- [x] 5.3 驗證選擇性匯入與頁面跳轉：選擇性勾選部分案例後點擊匯入，檢查資料庫成功建立新專案且頁面自動跳轉至新建立的專案頁。