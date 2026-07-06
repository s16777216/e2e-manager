## Context

現有的 E2E 執行流程在步驟全部順利完成後，會進入最後的全局視覺斷言節點 `asserterNode`，此節點會使用 LLM（Gemini 2.0）並帶入整個 Testcase 的預期結果 `testcase.expected` 進行圖片與文字比對。
由於大部分測試案例的預期結果常包含 Toast 提示等暫態元素（一瞬即逝），在測試步驟全數跑完後 Toast 早已消失，導致最終驗證高機率發生誤判，且額外浪費了 LLM API Token 消耗。

## Goals / Non-Goals

**Goals:**
- 在 `asserterNode` 中廢棄最終視覺斷言的 LLM 呼叫，直接將 `TestRun` 狀態設為 `passed`。
- 確保瀏覽器實例在測試結束時依然能夠被正確關閉（`browserManager.closeBrowser()`）。
- 確保所有 token 統計欄位依然能正常累加寫入資料庫（`asserterPromptTokens`、`asserterCompletionTokens` 等設為 `0`，並正確寫入 TestRun）。

**Non-Goals:**
- 不修改 `step_asserterNode` 邏輯，單步預期結果的即時視覺斷言依然保留以提供局部的正確性驗證。
- 不刪除資料庫中的 `expected` 欄位（以維持向後相容與歷史測試案例的可讀性）。

## Decisions

### 1. 移除 `asserterNode` 的 LLM 呼叫，直接標記 PASS
- **做法**：將 `graph.ts` 的 `asserterNode(state)` 重構，直接調用 `this.browserManager.closeBrowser()`，並將狀態更新為 `passed`、`finalResult` 設為 `"PASS"`、理由設為 `"所有測試步驟均已成功執行完畢。"`，不調用 `asserter_model`。
- **好處**：完全消除因 Toast 消失引起的誤判，節省 Token 開銷，並將成功點提前至步驟與單步斷言皆正常完成的時刻。
- **替代方案**：
  - *方案 B (非阻斷驗證)*：LLM 依舊執行判定但不管 PASS 還是 FAIL 都回傳測試通過。缺點是仍浪費 API Token 與時間。
  - *方案 C (框架預存 Toast)*：在步驟執行時把 Toast 截圖存下來傳給 `asserterNode`。缺點是大幅增加了 State 與 Playwright 監聽邏輯的複雜度。

## Risks / Trade-offs

- **[Risk]** 全局驗證廢棄後，如果所有步驟執行完但網頁進入了錯誤的全局狀態（如未被單步 expected 捕獲的頁面崩潰），測試仍會判定為 PASS。
  - **Mitigation**：建議使用者在最後一個步驟中明確加入對應的預期結果（`step_expected`）來捕獲該頁面的最終狀態，以此替代全局斷言。
