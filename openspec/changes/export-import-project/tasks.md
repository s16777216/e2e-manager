## 1. 後端 Data Models & Helper Functions (Backend Services)

- [ ] 1.1 新增 `backend/src/services/exportImportService.ts` 服務檔。
- [ ] 1.2 實作 `exportProjectData(projectId: string)` 函式：遞迴查詢指定 Project 及其所有 TestGroups、Testcases 與 TestcaseSteps，過濾掉所有內置 ID（如 UUID）、時間戳記、TestRuns、TestLogs，組裝為標準 `ExportProjectPayload` 物件。
- [ ] 1.3 實作 `previewImportData(jsonPayload: any)` 函式：驗證 `$schemaVersion` 與結構合法性；查詢資料庫是否存在同名 Project，並自動產出 `suggestedName`；計算統計數據（總 Group 數、總 Case 數、總 Step 數）；為樹狀結構每個節點分配臨時 ID（如 `tempId`）方便前端選取控制。
- [ ] 1.4 實作 `executeImportProject(data: ImportConfirmPayload)` 函式：開啟 TypeORM 資料庫 Transaction；先建立新 `Project` 記錄；透過 DFS/BFS 遞迴建立 `TestGroup`（建立後保存新 UUID 並綁定父子關聯），寫入 `Testcase` 及 `TestcaseStep`；確保寫入過程異常時觸發完整 Rollback。

## 2. 後端 API Routes 實作 (Backend API Endpoints)

- [ ] 2.1 於 `backend/src/routes/exportImport.ts`（或整合於既有 project 路由檔）新增 3 個 API 路由。
- [ ] 2.2 實作 `GET /api/projects/:id/export` 路由：呼叫 `exportProjectData`，發送包含 HTTP Header `Content-Disposition: attachment; filename="project-export.json"` 的 JSON 下載響應。
- [ ] 2.3 實作 `POST /api/projects/import/preview` 路由：接受上傳的 JSON 檔案（經由 multer 中間件處理）或 JSON Request Body，呼叫 `previewImportData`，回傳預覽資訊與格式校驗結果。
- [ ] 2.4 實作 `POST /api/projects/import` 路由：接受 `ImportConfirmPayload`，呼叫 `executeImportProject` 完成寫入，回傳 HTTP 201 與新建專案 ID。
- [ ] 2.5 於 `backend/src/server.ts` 註冊該 API 路由。

## 3. 前端 API 串接與路由設定 (Frontend API Services & Routing)

- [ ] 3.1 於 `frontend/src/routes.tsx` 註冊獨立頁面路由 `/projects/import`，指向 `ProjectImportView` 元件。
- [ ] 3.2 於前端 API 模組（如 `frontend/src/lib/api/projectApi.ts`）新增 `exportProject(id: string)` 觸發檔案下載處理。
- [ ] 3.3 於前端 API 模組新增 `previewImportProject(file: File)` 檔案發送至後端預覽 API 的請求函式。
- [ ] 3.4 於前端 API 模組新增 `confirmImportProject(payload: ImportConfirmPayload)` 發送最後確定的匯入請求函式。

## 4. 前端獨立頁面 UI 與互動實作 (Frontend Standalone Import Page)

- [ ] 4.1 建立獨立頁面元件 `frontend/src/views/ProjectImportView.tsx` (路由 `/projects/import`)。
- [ ] 4.2 於 `ProjectImportView.tsx` 實作檔案選取與拖曳上傳區 (Dropzone)，上傳後呼叫預覽 API 載入資料。
- [ ] 4.3 於 `ProjectImportView.tsx` 實作專案基本屬性表單（名稱與描述修改）。
- [ ] 4.4 於 `ProjectImportView.tsx` 實作階層樹狀勾選清單 (Checkbox Tree)，包含搜尋關鍵字過濾框、[全選]、[全部取消] 控制按鈕。
- [ ] 4.5 於 `ProjectImportView.tsx` 實作勾選連動邏輯：勾選/取消勾選父 Group 時連動子項目；選取子 Testcase 時自動保證父 Group 被勾選。
- [ ] 4.6 實作確認匯入流程：點擊「開始匯入專案」送出數據，成功後顯示 Toast 並跳轉引導至新專案頁面 `/projects/:newProjectId`。
- [ ] 4.7 於專案列表視圖 (Project List Page) 新增「匯入專案」按鈕，點擊觸發導頁至 `/projects/import`。
- [ ] 4.8 於專案列表項目選單（或專案詳細頁）新增「匯出專案」按鈕，點擊觸發 `exportProject` 下載檔案。

## 5. 驗證與閉環測試 (Verification)

- [ ] 5.1 手動或寫測試案例驗證專案匯出：檢查下載的 JSON 檔案格式是否乾淨、不包含舊 UUID 與 TestRuns。
- [ ] 5.2 驗證 `/projects/import` 獨立頁面預覽：上傳壞掉的 JSON 驗證 400 錯誤；上傳正常 JSON 驗證 `suggestedName` 重複處理與階層搜尋過濾。
- [ ] 5.3 驗證選擇性匯入與頁面跳轉：選擇性勾選部分案例後點擊匯入，檢查資料庫成功建立新專案且頁面自動跳轉至新建立的專案頁。
