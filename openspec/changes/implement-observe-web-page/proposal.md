## Why

現有 AI Agent 在執行 E2E 測試時，使用 `getSimplifiedDOM` 提取含有長 Selector（如 `button:has-text("登入送出")` 或 `button[name="submit"]`）的簡化 DOM 文字，並讓 LLM 閱讀。這導致了以下幾個主要問題：
1. **Token 消耗巨大**：長 Selector 反覆出現在 prompt 中，每次 LLM 生成 click/input 操作時也需要輸出完整 Selector，增加了 Token 成本。
2. **定位精準度低**：當頁面出現多個文字相似或結構雷同的元素時，產生的 Selector 容易重複或失效，進而點錯元素。
3. **視覺與文字不一致**：多模態 LLM (如 Gemini) 在讀取網頁螢幕截圖與 Text DOM 時，缺乏統一的錨點來精確對應「看見的畫面位置」與「讀到的 DOM 標籤」。

實作本變更將透過在網頁中動態注入數字標籤（ID），解決上述定位與 Token 浪費問題。

## What Changes

- 新增 `observe_web_page` 工具，此工具在瀏覽器端執行 JavaScript，為所有可見且可互動的元素動態注入唯一的數字標籤 `data-agent-id`。
- 回傳給 AI Agent 的文字 DOM 列表改為只包含 ID 與基本語意資訊（如 `[15] <button> 登入送出`），大幅降低 Token。
- 重構現有的 `click_element` 與 `input_text` 工具，使其參數從長 Selector 簡化為數字 ID（例如 `{ id: 15 }`），由後端根據 DOM 中的 `[data-agent-id="15"]` 進行 100% 精準定位。
- 在 `observe_web_page` 執行時，於網頁畫面注入黃底黑字的小貼紙浮動層，讓多模態模型在截圖上能直接對應數字 ID 進行精準空間定位。

## Capabilities

### New Capabilities
- `perception-tool`: 實作 `observe_web_page` 感知工具、動態 ID 注入機制，以及基於 ID 的 Action 工具（click_element 與 input_text）重構。

### Modified Capabilities
<!-- 無 -->

## Impact

- `backend/src/tools.ts`: 新增 `observe_web_page` 工具，重構 `click_element`、`input_text`。
- `backend/src/browser.ts`: `BrowserManager` 新增動態標籤 CSS 注入與浮動貼紙渲染邏輯。
- `backend/src/graph.ts`: 調整 LangGraph Executor 節點的 Prompt 與工具調用方式，改為先 Observe 再 Action 的流程。
