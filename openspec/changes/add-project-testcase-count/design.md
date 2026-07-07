## Context

目前的「專案管理」列表頁面表格中，雖然定義了「測試案例數」欄位（`testcaseCount`），但由於後端 `GET /api/projects` 路由僅回傳 Project 實體的資料庫原始資料，並未聯表計算該專案旗下所有群組內所屬的測試案例數量，導致該欄位在前端渲染時皆顯示為空（`undefined`）。

## Goals / Non-Goals

**Goals:**
- 優化後端 `GET /api/projects` 接口，回傳包含每個專案底下測試案例總數的欄位 `testcaseCount`。
- 更新前端型別定義以支援 `testcaseCount`。
- 保證「專案管理」頁面表格能夠正確渲染各專案的測試案例總數。

**Non-Goals:**
- 不修改資料庫的 `Project` 實體 Schema（不在 `Project` 表新增實體欄位）。
- 不調整其他非列表查詢的專案 API（如單一查詢 `GET /projects/:id`）。

## Decisions

### 決策 1：後端採用多重查詢與 JS 合併，或 SQL Join 聚合
- **方案 A（選用）**：先查詢專案列表，再使用 SQL `GROUP BY g.projectId` 統計各專案的 `testcase` 數量，並於記憶體中將統計結果合併至專案列表。
  - **優點**：保留 TypeORM 預設的 `Repository.find()`，以避免 `getRawMany()` 遺失欄位型別轉換，且 SQL 聚合查詢高效安全。
  - **缺點**：需要發送兩次資料庫查詢，但在專案列表場景下，兩次簡單查詢的效能開銷極低。
- **方案 B**：使用 TypeORM `leftJoinAndSelect` 在一次查詢中帶出所有關聯，並在記憶體中計算數量。
  - **優點**：僅需一次資料庫查詢。
  - **缺點**：如果測試案例與群組量極大，將所有關聯數據一次性載入記憶體會造成嚴重的記憶體溢出與效能問題。

### 決策 2：前端型別對齊
- 擴充 [api.ts](file:///c:/works/e2e-manager-ts/frontend/src/types/api.ts) 中的 `Project` 介面，宣告選擇性屬性 `testcaseCount?: number`。
- 前端 [projectColumns.tsx](file:///c:/works/e2e-manager-ts/frontend/src/features/projects/columns/projectColumns.tsx) 不需變更渲染邏輯，因其原本就已讀取 `testcaseCount` 並進行置中渲染。

## Risks / Trade-offs

- **[Risk]** 當專案中無任何 Testcase 或 Group 時，Count 統計回傳 `0`。
  - **Mitigation**: 使用 `countMap.get(p.id) || 0` 以確保無資料時預設顯示為 `0`。
