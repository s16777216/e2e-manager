## Why

目前的「專案管理」列表頁面表格中，雖然定義了「測試案例數」欄位（`testcaseCount`），但由於後端 `GET /api/projects` 路由僅回傳 Project 實體的資料庫原始資料，並未聯表計算該專案旗下所有群組內所屬的測試案例數量，導致該欄位在前端渲染時皆顯示為空（`undefined`）。為了提升使用者對專案規模的掌握度，此變更旨在優化 API 以提供正確的測試案例數量。

## What Changes

- **後端 API 優化**：修改 `GET /api/projects` 路由，在查詢專案列表時，透過聯表（Join）與分組（GroupBy）計算各專案底下的測試案例（Testcases）總數量並夾帶於 `testcaseCount` 欄位回傳。
- **前端型別擴充**：於前端的 `Project` 介面中新增 `testcaseCount?: number` 屬性。
- **前端表格顯示**：確保「專案管理」頁面的表格能正確渲染 `testcaseCount` 數值。

## Capabilities

### New Capabilities

<!-- 無新增能力 -->

### Modified Capabilities

- `project-views`: 新增專案管理列表頁面中顯示專案測試案例總數的要求與場景。

## Impact

- 後端路由：[project.ts](file:///c:/works/e2e-manager-ts/backend/src/routes/project.ts) 中的 `GET /` 路由
- 前端型別：[api.ts](file:///c:/works/e2e-manager-ts/frontend/src/types/api.ts) 中的 `Project` 介面
- 前端元件：[projectColumns.tsx](file:///c:/works/e2e-manager-ts/frontend/src/features/projects/columns/projectColumns.tsx) （型別對齊與資料顯示）
