## Context

目前底層 Browser Manager (Playwright) 在執行測試時，僅對 Agent 暴露固定且嚴格的 8 個工具（`navigate_to`, `observe_web_page`, `click`, `input`, `key`, `hover`, `wait_for_seconds`, `done_acting`）。
當遭遇非標準 DOM 元素、動畫過渡未完成或 UI 框架專屬浮層（如 PrimeVue `.p-multiselect-option`）時，Agent 常因無法從 `observe_web_page` 的標籤 ID 中取得可互動數字而中斷任務。

## Goals / Non-Goals

**Goals:**
- 在 `BrowserTools` 中新增 `execute_javascript` 工具。
- 將腳本透過 `page.evaluate()` 在當前 Playwright Page context 中執行，安全捕獲執行錯誤並回傳結構化文字結果。
- 在 `prompt.ts` 的系統提示詞中，寫明 `execute_javascript` 工具的使用時機與最佳實踐（範例包含選擇並點擊 `.p-multiselect-option` 等浮層選項）。

**Non-Goals:**
- 不向使用者 UI 介面新增額外開關或視覺按鈕。
- 不修改 `observeWebPage` 的貼紙生成演算法（保留原有貼紙流程，將 JS 工具作為補救逃生通道）。

## Decisions

### 1. 使用 `page.evaluate()` 搭配 `Function` 包裹腳本
- **抉擇**：在 `page.evaluate()` 中，使用 `const fn = new Function("return (async () => { " + script + " })();");` 包裹 Agent 傳入的 JS 程式碼。
- **原因**：允許 Agent 撰寫包含多行語法、`document.querySelector` 或 `Array.from()` 的匿名表達式，並能在異步情境下直接回傳執行結果。

### 2. 捕捉與格式化例外
- **抉擇**：以 `try...catch` 包裹 `evaluate` 調用，回傳字串 `"JavaScript 執行成功。腳本回傳值: ..."` 或 `"執行 JavaScript 失敗：[Error Message]"`。
- **原因**：防止 Agent 傳入無效的 CSS Selector 或語法錯置時直接引發 Node.js Crash，讓 Agent 能夠根據 Error 訊息即時自我修正語法。

## Risks / Trade-offs

- **[Risk] 腳本執行無限迴圈或阻塞頁面** → **[Mitigation]**：Playwright `page.evaluate()` 預設帶有頁面導航/腳本執行 Timeout 限制（預設 30 秒），防止死鎖。
- **[Risk] Agent 過度依賴 JS 點擊而繞過視覺貼紙** → **[Mitigation]**：在 Prompt 中說明首選依然是標籤 ID 操作，`execute_javascript` 是在 `observe_web_page` 未能標記目標元素時的進階解決方案。
