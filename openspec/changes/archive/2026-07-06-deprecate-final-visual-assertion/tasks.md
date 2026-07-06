## 1. 調整 LangGraph 最終視覺斷言節點

- [x] 1.1 重構 `E2EGraphBuilder` 中的 `asserterNode` ([graph.ts](file:///c:/works/e2e-manager-ts/backend/src/graph.ts))。移除 LLM 與 Prompts 相關邏輯，改為自動將測試結果判定為 `PASS` (理由為「所有測試步驟均已成功執行完畢。」)。
- [x] 1.2 確保 `asserterNode` 在標記 PASS 的同時，安全關閉 Playwright 瀏覽器 (`browserManager.closeBrowser()`) 並正常將資料寫入 DB 且發送通知。
- [x] 1.3 修正 `observe_web_page` 工具的回傳值，僅回傳 `elementList` 純文字，避免大圖檔 Base64 塞爆 LLM 的對話歷史。


## 2. 系統驗證與測試

- [x] 2.1 啟動 dev 伺服器並執行一項範例 E2E 測試，確保在所有步驟順利執行完後直接 PASS，不調用 asserter model，且完整寫入 TestRun 與 logs 狀態。

## 3. 前端 UI 調整

- [x] 3.1 調整 `useTestcaseData.ts` ([useTestcaseData.ts](file:///c:/works/e2e-manager-ts/frontend/src/hooks/useTestcaseData.ts)) 驗證邏輯，使最終預期結果（expected）變為選填。
- [x] 3.2 調整 `TestCaseEditBlock.tsx` ([TestCaseEditBlock.tsx](file:///c:/works/e2e-manager-ts/frontend/src/features/projects/components/TestCaseEditBlock.tsx)) 的表單驗證與 UI 標示，移除預期結果的必填限制與星號標記，並加上選填標示。

