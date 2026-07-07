## Why

當使用者載入專案詳細頁面時，左側群組樹狀表格中的「子項目/步驟數」欄位在群組尚未展開前都會顯示為 0。這是因為前端採用懶加載（Lazy Loading）機制，在展開群組前尚未獲取其下的測試案例（Testcases）。為了改善使用者體驗，避免使用者誤以為群組內沒有測試案例，我們需要在專案初始化加載群組樹時，由後端預先計算並回傳各群組的測試案例數量。

## What Changes

- **後端 API 優化**：修改 `/projects/:projectId/groups` 路由，在查詢群組列表時，預先計算並夾帶各群組下的測試案例（Testcases）總數量（例如新增 `testcaseCount` 欄位），而不需載入完整的測試案例內容。
- **前端樹狀資料結構調整**：在前端的 `TestGroup` 型別定義中新增 `testcaseCount` 欄位。
- **前端 itemCount 計算邏輯優化**：在 `ProjectDetailView.tsx` 中，計算 `itemCount` 時，將未展開群組的測試案例數改為使用預先載入的 `testcaseCount`（而非依賴懶加載後的 `testcasesMap` 長度），使群組在未展開前也能顯示正確的子項目數量。

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `project-views`：在專案詳細頁面（Project Detail View）中，樹狀表格的「子項目/步驟數」在群組未展開前，也必須能正確顯示該群組所含的子群組及測試案例總數。

## Impact

- **`backend/src/routes/group.ts`**：修改 `/projects/:projectId/groups` 路由處理，在回傳的樹狀群組資料中，對每個群組物件附加其 testcase 的數量。
- **`frontend/src/types/api.ts`**（或對應定義）：擴充 `TestGroup` 介面，加入 `testcaseCount?: number`。
- **`frontend/src/features/projects/pages/ProjectDetailView.tsx`**：調整 `buildNestedTree` 中 group 的 `itemCount` 計算邏輯。
