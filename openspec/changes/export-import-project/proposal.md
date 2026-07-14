## Why

為了讓使用者能便利地進行 E2E 測試專案的跨環境搬遷、備份與團隊協作，系統需要支援專案層級的匯出與匯入功能。專案匯出將規格與測試步驟產生為 JSON 檔案，匯入時則提供獨立的匯入管理頁面 (`/projects/import`) 與後端驗證，讓使用者能直觀且彈性地選擇要恢復的測試案例並安全建立新專案。

## What Changes

- **專案匯出功能 (Export Project)**：新增專案規格與步驟定義的匯出能力，產出格式為包含專案屬性、TestGroup 階層、Testcase 及 TestcaseStep 的純淨 JSON 檔案（自動排除 TestRun 與 TestLog 等過往執行歷史）。
- **專案匯入預覽與校驗 (Import Project Preview API)**：新增後端 API，負責接受上傳的 JSON 檔案、校驗格式與 Schema 合法性、生成自動處理衝突的建議新專案名稱、並組裝出可供前端顯示的樹狀階層結構。
- **專案匯入確認 (Confirm Import Project API)**：新增後端 API，接受經過使用者在獨立匯入頁面中勾選保留的專案樹狀結構與新專案名稱，於資料庫內以 Transaction 安全建立全套新實體（分配全套新 UUID）。
- **前端介面 (Frontend UI)**：
  - 在專案列表頁 (Project List Page) 新增「匯入專案」按鈕，點擊後導頁至獨立的匯入頁面 `/projects/import`。
  - 新增獨立匯入頁面視圖 (`ProjectImportView.tsx` 路由 `/projects/import`)，提供檔案拖曳/選擇上傳、專案基本設定修改、全版面階層樹狀勾選清單（含全選/全部取消/關鍵字搜尋）與確認匯入動作。匯入成功後自動跳轉至新建立的專案頁面。
  - 在專案操作選單中新增「匯出專案」觸發下載按鈕。

## Capabilities

### New Capabilities
- `project-export-import`: 提供專案階層資料（含 Project, TestGroup, Testcase, TestcaseStep）的 JSON 匯出、後端預覽校驗、獨立匯入頁面 (`/projects/import`) 的預覽勾選以及交易安全性匯入。

### Modified Capabilities
（無變更現有能力）

## Impact

- **Backend Architecture & APIs**:
  - `GET /api/projects/:id/export`
  - `POST /api/projects/import/preview`
  - `POST /api/projects/import`
  - 後端資料庫操作（TypeORM Entity: Project, TestGroup, Testcase, TestcaseStep）。
- **Frontend Components & Routing**:
  - 專案列表視圖新增「匯入專案」按鈕。
  - 新增前端路由 `/projects/import` 與對應頁面視圖元件 (`ProjectImportView.tsx`)。
  - 匯入樹狀選擇器與搜尋元件。
  - API 串接 Functions (`frontend/src/lib/api/...` 或 service 模組)。
