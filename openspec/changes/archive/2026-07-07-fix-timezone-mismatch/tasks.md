## 1. 調整後端實體定義 (Entities Modification)

- [x] 1.1 修改 Project 實體 (`backend/src/entities/Project.ts`) 中的 `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。
- [x] 1.2 修改 SystemSetting 實體 (`backend/src/entities/SystemSetting.ts`) 中的 `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。
- [x] 1.3 修改 Task 實體 (`backend/src/entities/Task.ts`) 中的 `createdAt` 為 `@CreateDateColumn({ type: "timestamptz" })` 且 `finishedAt` 欄位為 `@Column("timestamptz", ...)` 型別。
- [x] 1.4 修改 TestGroup 實體 (`backend/src/entities/TestGroup.ts`) 中的 `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。
- [x] 1.5 修改 TestLog 實體 (`backend/src/entities/TestLog.ts`) 中的 `createdAt` 欄位為 `timestamptz` 型別。
- [x] 1.6 修改 TestRun 實體 (`backend/src/entities/TestRun.ts`) 中的 `startedAt`, `finishedAt`, `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。
- [x] 1.7 修改 TestRunStep 實體 (`backend/src/entities/TestRunStep.ts`) 中的 `startedAt`, `finishedAt`, `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。
- [x] 1.8 修改 Testcase 實體 (`backend/src/entities/Testcase.ts`) 中的 `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。
- [x] 1.9 修改 TestcaseStep 實體 (`backend/src/entities/TestcaseStep.ts`) 中的 `createdAt` 與 `updatedAt` 欄位為 `timestamptz` 型別。

## 2. 驗證資料庫結構同步與功能測試

- [x] 2.1 啟動本地後端服務，使 TypeORM 自動同步並更新 PostgreSQL 資料表欄位至 `timestamptz`。
- [x] 2.2 檢查後端 API 回傳的 JSON 時間欄位，是否皆為帶有 `Z` 結尾之正確 UTC ISO 字串。
- [x] 2.3 在瀏覽器中操作並核對各時間欄位（專案列表、執行歷史、批次詳情），確認顯示的時間為正確的台北本地時間。
