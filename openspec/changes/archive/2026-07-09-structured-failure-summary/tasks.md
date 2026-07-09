## 1. 資料庫變更與舊數據清理

- [x] 1.1 執行 SQL 指令將資料庫中的舊 `failureSummary` 欄位清空，避免欄位轉移為 jsonb 時報錯。
- [x] 1.2 修改 `backend/src/entities/TestRun.ts` 中的 `failureSummary` 欄位型別，將 `@Column("text")` 變更為 `@Column("jsonb")`，並更新 TypeScript 型別。

## 2. 後端 Zod 與狀態機重構

- [x] 2.1 於 `backend/src/graph.ts` 的 `reporterNode` 節點中，移除手動的 `JSON.stringify` 轉換，直接將 AI 物件 response 賦值給 `run.failureSummary`。
- [x] 2.2 於 `reporterNode` 節點中，更新 `catch` 例外降級機制，直接將物件格式的 Fallback JSON 賦值給 `run.failureSummary`。

## 3. 前端型別與 UI 面板重構

- [x] 3.1 於 `frontend/src/types/api.ts` 中，更新 `TestRun` 介面的 `failureSummary` 型別，對齊強型別物件。
- [x] 3.2 於 `frontend/src/components/custom/AIFailureSummaryPanel.tsx` 中，移除所有 `JSON.parse`、Regex 提取與 Fallback 邏輯，改為直接解構強型別的 `summary` 物件進行 Bento 渲染。

## 4. 功能驗證

- [x] 4.1 執行後端單元測試，確保 `npm test` 通過。
- [x] 4.2 執行一次失敗測試，確認資料庫寫入的是合格的 JSONB 物件，且前端 Bento 佈局百分之百精準顯示。
