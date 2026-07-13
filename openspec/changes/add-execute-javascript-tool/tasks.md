## 1. 後端 Browser Tool 實作

- [ ] 1.1 在 `backend/src/tools.ts` 中新增 `execute_javascript` 工具，實作基於 Playwright `page.evaluate()` 的 JS 腳本評估與 Try-Catch 例外包裹處理
- [ ] 1.2 將 `execute_javascript` 加入 `BrowserTools.getTools()` 傳回陣列中，確保 Agent 在載入時能感知與呼叫此工具

## 2. 系統提示詞 (System Prompt) 整合

- [ ] 2.1 更新 `backend/src/graph/prompt.ts` 中的 `# Available Tools` 區塊，加入 `execute_javascript` 的說明與語法範例
- [ ] 2.2 在 `buildExecutorSystemPrompt` 中加入動態選單與非標準標籤 (如 PrimeUI `.p-multiselect-option`) 的 DOM 腳本避險操作引導

## 3. 功能驗證與測試

- [ ] 3.1 驗證 `execute_javascript` 在正常 DOM 點擊/檢索情境下的腳本回傳結果
- [ ] 3.2 驗證腳本執行語法錯誤或 Selector 不存在時的 Exception 捕捉與回傳格式
