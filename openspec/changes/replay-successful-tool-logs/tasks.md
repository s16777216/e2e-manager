## 1. 基礎設施與日誌查詢實作

- [ ] 1.1 在 `backend/src/graph.ts` 中，實作查詢該測試案例（`test_name`）上一次成功（`passed`）執行之對應步驟（`stepIdx`）歷史工具日誌（`TestLog`）的輔助函式。
- [ ] 1.2 設計解析 `TestLog.action` 字串為工具名稱（如 `click`）與呼叫參數對象的解析工具函式。

## 2. 核心重放邏輯 (Replay Mode) 實作

- [ ] 2.1 修改 `backend/src/graph.ts` 中的 `executorNode`，在啟動 LLM 呼叫前進行攔截：若有上一次成功的工具執行紀錄，則進入重放模式。
- [ ] 2.2 在重放模式下，依然呼叫 `observeWebPage()` 進行實時的 ID 注入，但不呼叫 Gemini LLM 推導，而是依序提取解析出的歷史工具參數，並執行 `selected_tool.invoke(args)`。

## 3. 異常捕獲與自我修復 (Self-healing)

- [ ] 3.1 在 `executorNode` 的重放執行邏輯中加入 `try-catch` 異常處理。
- [ ] 3.2 若重放過程中任何工具呼叫拋出異常（例如 `TimeoutError`），捕獲該異常，清除當前重放所寫入的臨時紀錄，並將控制權交還給一般的 LLM Executor 呼叫，重新觀察頁面並推導動作。

## 4. 驗證與整合測試

- [ ] 4.1 啟動系統，建立一個測試案例並成功跑完一次（生成 passed 的 TestRun）。
- [ ] 4.2 重新啟動同一個測試案例，確認第二次執行時，後端沒有輸出 Executor 呼叫的 LLM Token 紀錄，且步驟依然全數 Passed（重放成功）。
- [ ] 4.3 人為修改測試目標網頁結構（例如更改按鈕文字或刪除輸入框），執行同一個測試案例，驗證是否在重放超時後成功 Fallback 到 Agent 推導模式完成自我修復，並在資料庫更新新的操作紀錄。
