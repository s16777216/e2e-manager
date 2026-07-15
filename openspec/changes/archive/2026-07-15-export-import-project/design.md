## Context

現有的 E2E 測試管理系統包含 Project、TestGroup（樹狀階層）、Testcase 及 TestcaseStep 等核心 TypeORM 實體。為了提升可移植性與測試維護效率，系統需新增「專案層級匯出/匯入」功能。此功能包含後端 API (Node.js/Express + TypeORM) 與前端獨立管理頁面 (`/projects/import`)，並於專案編輯頁面放置專案備份與匯出區塊。

## Goals / Non-Goals

**Goals:**
- 提供 `GET /api/projects/:id/export` 下載全套專案定義 JSON 檔（去除內部 UUID、歷史日誌與執行紀錄）。
- 提供 `POST /api/projects/import/preview` 由後端驗證上傳 JSON、檢查名稱重複、並組裝出可供選取的階層樹狀預覽結構。
- 提供 `POST /api/projects/import` 使用 TypeORM EntityManager/QueryRunner 開啟 Transaction，一鍵原子化寫入新 Project 及其被勾選的 TestGroup / Testcase / TestcaseStep。
- 前端於路由系統新增獨立頁面 `/projects/import` (`ProjectImportView.tsx`)，提供大版面檔案上傳、專案設定修改、樹狀勾選控制（包含搜尋與全選/全部取消）、與匯入成功後自動導頁至新專案 (`/projects/:newProjectId`)。
- 於編輯專案頁面 (`ProjectEditView.tsx`) 的危險區域 (`ProjectFormDangerBlock.tsx`) 正上方新增「專案備份與匯出 (Data Export)」獨立 FormBlock 卡片，提供「匯出 JSON」按鈕供使用者下載備份。
- 寫出極度清晰明確的規格與步驟說明，方便後續由小模型執行程式碼寫入。

**Non-Goals:**
- 現階段不安裝 ZIP/壓縮檔封裝庫，統一使用格式明確的 `.json` 檔案。
- 現階段不實作「單一測試案例」或「單一測試群組」的個別匯出匯入。
- 不匯出與匯入歷史執行記錄 (TestRun / TestLog)。

## Technical Decisions

### 1. JSON Export Schema 結構
匯出產出的 JSON 格式遵循以下結構標準：

```typescript
interface ExportProjectPayload {
  $schemaVersion: "1.0";
  exportedAt: string; // ISO timestamp
  project: {
    name: string;
    description?: string;
    systemPrompt?: string;
    initCookies?: any;
    initLocalStorage?: any;
    variables?: any;
    groups: ExportGroupPayload[];
  };
}

interface ExportGroupPayload {
  name: string;
  systemPrompt?: string;
  disableParentPrompt?: boolean;
  initCookies?: any;
  initLocalStorage?: any;
  variables?: any;
  children?: ExportGroupPayload[];
  testcases?: ExportTestcasePayload[];
}

interface ExportTestcasePayload {
  name: string;
  expected: string;
  systemPrompt?: string;
  disableParentPrompt?: boolean;
  initCookies?: any;
  initLocalStorage?: any;
  variables?: any;
  steps: {
    stepIndex: number;
    action: string;
    target: string;
    value?: string;
  }[];
}
```

### 2. Backend Routes 實作決策 (`backend/src/routes/exportImport.ts`)
- **`GET /api/projects/:id/export`**:
  - 利用 TypeORM 遞迴 `find` 或 `TreeRepository` 載入完整 `Project` 及其屬下 `groups` (包含 `children`, `testcases`, `steps`)。
  - 乾淨映射過濾掉 `id`, `createdAt`, `updatedAt`, `projectId`, `groupId`, `testcaseId`, `runs` 等欄位。
  - 回傳 header: `Content-Disposition: attachment; filename="project-${name}.json"`。

- **`POST /api/projects/import/preview`**:
  - 接受 `multer` 上傳之 JSON 檔案，或接受 JSON Body `payload`。
  - 驗證 `$schemaVersion === "1.0"` 且核心欄位存在。
  - 檢查目前 DB 中是否已有同名 Project。若有，`suggestedName` 自動生成 `${name} (Imported)`。
  - 替每個 node 生成前端獨立識別碼（如 `tempId`），回傳給前端渲染預覽樹狀圖。

- **`POST /api/projects/import`**:
  - Payload 結構：
    ```typescript
    interface ImportConfirmPayload {
      projectName: string;
      description?: string;
      systemPrompt?: string;
      initCookies?: any;
      initLocalStorage?: any;
      variables?: any;
      selectedTree: ExportGroupPayload[]; // 已剔除未勾選項目的樹狀結構
    }
    ```
  - 開啟 DB Transaction (`dataSource.transaction(async transactionalEntityManager => { ... })`)。
  - 遞迴建置 `TestGroup`（維持 parent 關聯）➔ 建置 `Testcase` ➔ 建置 `TestcaseStep`。
  - 發生錯誤全數 Rollback。

### 3. Frontend Architecture & Routing
- **編輯專案頁面備份區塊 (`ProjectEditView.tsx`)**:
  - 於 `ProjectFormDangerBlock.tsx` 正上方新增 `ProjectFormExportBlock.tsx` 區塊（標題：專案備份與匯出，描述：將專案規格、測試群組與步驟匯出為 JSON 檔案，以供備份或跨環境轉移）。
  - 提供「匯出 JSON」按鈕，呼叫 `window.location.href = api.exportProject(projectId)` 觸發下載。
- **獨立匯入頁面 (`ProjectImportView.tsx`)**:
  - Route: `/projects/import`
  - Breadcrumb: `專案列表 / 匯入專案`
  - Zone 1: File Dropzone (拖曳/點擊選檔上傳)，上傳成功後觸發 `/api/projects/import/preview`。
  - Zone 2: Project Metadata Form (修改專案名稱、描述)。
  - Zone 3: Tree Checklist (呈現樹狀 Groups & Testcases，包含關鍵字過濾 Input、[全選]、[全部取消] 控制按鈕)。
  - Zone 4: Control Bar (`[取消返回]` 按鈕導回 `/projects`，`[🚀 開始匯入專案]` 按鈕送出匯入並導頁至 `/projects/:newProjectId`)。

## Risks / Trade-offs

- **[Risk] 大檔案 JSON 遞迴層級過深導致堆疊溢位或 DB 效能阻塞**  
  → **Mitigation**: 使用標準的非同步迭代寫入 DB Transaction；大部分測試專案案例數量在數千個以內，單次串行寫入效能足夠。

- **[Risk] 多層樹狀 Group 的 Parent/Child ID 重新對應複雜度**  
  → **Mitigation**: 在 Transaction 內部實作 DFS/BFS 走訪，先 `save()` Parent Group 拿到全新的 DB UUID，再將其作為 `parent` 賦予 Child Group 進行遞迴建立。
