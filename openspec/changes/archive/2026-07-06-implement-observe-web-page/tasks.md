## 1. 瀏覽器端 DOM ID 注入與貼紙渲染

- [x] 1.1 在 `BrowserManager` ([browser.ts](file:///c:/works/e2e-manager-ts/backend/src/browser.ts)) 中實作互動元素辨識與 `data-e2e-agent-id` 屬性注入。
- [x] 1.2 在 `BrowserManager` 中實作動態浮動標籤（黃色貼紙）Overlay 注入與樣式加入。
- [x] 1.3 確保在畫面截圖前渲染貼紙，截圖完成後即刻清除所有貼紙 DOM 與 CSS 樣式。

## 2. 註冊與實作新的 LangChain Tools

- [x] 2.1 在 `BrowserTools` ([tools.ts](file:///c:/works/e2e-manager-ts/backend/src/tools.ts)) 中新增並匯出 `observe_web_page` 工具。
- [x] 2.2 實作 `click` 工具，支援 `id`, `waitStrategy`, `expectedText` 參數與非同步監聽邏輯。
- [x] 2.3 實作 `input` 工具，支援 `id`, `text` 參數與 `page.fill` 定位寫入。
- [x] 2.4 實作 `key` 工具，支援 `id` (選填), `key`, `waitStrategy`, `expectedText` 參數，並模擬按鍵事件。
- [x] 2.5 實作 `hover` 工具，支援 `id` 參數與 `page.hover` 操作。
- [x] 2.6 清理/移除原先的 `click_element` 與 `input_text` 工具，避免 LLM 混淆。

## 3. LangGraph 決策節點與 Prompt 重構

- [x] 3.1 更新 Executor 的 System Prompt，教導模型如何使用 `observe_web_page` 進行觀察，並靈活運用 `click`、`input`、`key`、`hover` 四個工具。
- [x] 3.2 調整 `executorNode` 邏輯，確保模型能順暢使用新的 ID 互動與這四個拆分工具。

## 4. 系統驗證與整合測試

- [x] 4.1 啟動 dev 伺服器並執行一項範例 E2E 測試，確保測試步驟可藉由這四個新工具與 ID 精準執行，並成功通過測試。
