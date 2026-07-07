## Context

專案詳細頁面中，左側樹狀表格展示的群組「子項目/步驟數」在展開前均顯示為 0。這是因為前端的測試案例（Testcases）採用了懶加載（Lazy Loading）機制，在展開前尚未載入其詳細資料。為了在不影響效能的前提下讓使用者一開始就能看到正確的項目數量，需要優化後端 API 以便在回傳群組列表時即夾帶其下的測試案例計數。

## Goals / Non-Goals

**Goals:**
- 在群組未展開前，於表格的「子項目/步驟數」欄位正確顯示「子群組數 + 測試案例數」的總和。
- 透過後端進行輕量級的測試案例數量統計，並隨 `/projects/:projectId/groups` API 一併回傳。
- 維持測試案例詳細內容的懶加載設計，不影響頁面初始載入效能。

**Non-Goals:**
- 不在一開始就加載所有測試案例的詳細內容（如 steps, runs 等）。

## Decisions

### 1. 後端測試案例計數的取得方式
在 [groupRouter.get("/projects/:projectId/groups")](file:///c:/works/e2e-manager-ts/backend/src/routes/group.ts#L9) 中，我們需要獲取各群組的 testcase 數量：
* **決策**：在取得 `allGroups` 後，執行一個額外的聚合查詢獲取專案下所有群組的 testcases 數量，然後對應到回傳的群組物件中。
* **具體實作**：
  ```typescript
  const counts = await AppDataSource.getRepository(Testcase)
    .createQueryBuilder("tc")
    .select("tc.groupId", "groupId")
    .addSelect("COUNT(*)", "count")
    .groupBy("tc.groupId")
    .getRawMany();
  ```
  接著將數量附加至對應的 group：
  ```typescript
  groupMap.set(g.id, { ...g, testcaseCount: 0, children: [] });
  // 將 counts 填入對應的 group 物件
  ```

### 2. 前端型別與 itemCount 計算邏輯調整
* **型別定義**：在前端的 `TestGroup` 型別（位於 `frontend/src/types/api.ts` 等檔案）中新增選擇性欄位 `testcaseCount?: number`。
* **計算邏輯**：在 [ProjectDetailView.tsx](file:///c:/works/e2e-manager-ts/frontend/src/features/projects/pages/ProjectDetailView.tsx#L265) 中的 `buildNestedTree`：
  * 原先的 `tcCount` 計算為 `tcs.length`，其中 `tcs` 來自 `testcasesMap[node.id] || []`。
  * 修改為：若該群組的 `testcasesMap[node.id]` 還沒有資料（即 `!testcasesMap[node.id]`），則 `tcCount` 採用 `node.testcaseCount || 0`；若已載入，則採用 `testcasesMap[node.id].length`。
  * 這樣可以確保在載入前顯示預先載入的計數，載入後採用最新真實的陣列長度。

## Risks / Trade-offs

* **[Risk] 新增/刪除測試案例後數量不一致**
  * **Mitigation**：當使用者在此頁面新增或刪除測試案例後，現有機制會觸發 `setRefreshTrigger` 重新整理，而 `useGroupData` 會重新呼叫 `loadGroups`（重新抓取最新的群組樹與計數），同時亦會重新載入已展開的測試案例，這能確保計數與實際項目的同步性。
