## Context

現有的 AI Agent 與 Playwright 網頁互動機制，仰賴 `getSimplifiedDOM` 提取互動元素並透過 `calculateSelector` 動態計算出 Playwright 選擇器。此方法存在以下技術痛點：
1. 選擇器字串過長，AI 模型閱讀及生成長選擇器皆耗費高昂 Token。
2. 同類別或同文字的元素（如多個 "刪除" 按鈕）難以用簡單的語意選擇器區分，導致 AI 點擊錯誤。
3. 多模態 AI 在比對截圖畫面與文字 DOM 時，缺乏顯著的定位錨點。

為了解決這些問題，我們將引入數字 ID 標記系統，並將 Agent 的操作工具解耦成四個單一職責且語意明確的工具：`click`、`input`、`key`、`hover`。

## Goals / Non-Goals

**Goals:**
- 提供全新的 `observe_web_page` 感知工具，將 HTML 轉為包含簡短 ID 與基本資訊的乾淨文字列表。
- 動態在可互動的 HTML 元素上注入唯一的 `data-e2e-agent-id` 屬性，作為 100% 精準的定位依據。
- 提供四個專門的操作工具：
  - `click`：點擊指定 ID 的元素，支援非同步等待策略（文字出現/換頁導航）。
  - `input`：在指定 ID 的元素輸入文字。
  - `hover`：懸停至指定 ID 的元素。
  - `key`：對指定 ID 的元素（或全域頁面）發送鍵盤事件（如 `Enter`），支援非同步等待策略。
- 在截圖前動態於網頁中繪製與數字 ID 對應的視覺標籤（黃底黑字小貼紙），截圖後自動移除，協助多模態模型進行空間感知。

**Non-Goals:**
- 不保留原先的 `click_element` 與 `input_text` 工具，以防 LLM 混淆。
- 不提供複雜的拖曳（drag-and-drop）等非常規操作工具。

## Decisions

### 1. 工具解耦設計 (click, input, key, hover)
- **做法**：捨棄將所有操作塞入單一 `act_and_expect` 工具的設計，改為拆分四個 Zod Schema 簡單、語意明確的工具。
- **好處**：
  - 降低 LLM 的推理負擔，避免 LLM 在 hover 時誤填 text 等欄位。
  - 方便單獨為 `click` 與 `key` 擴充「等待策略」，因為這兩個操作最常引發網頁換頁或動態內容渲染。

### 2. 結合 ID 定位與等待策略的實作
- **`click` 工具**：
  - 參數：`id` (number), `waitStrategy` ("waitForNavigation"/"waitForText", **選填**, 無值代表不等待), `expectedText` (string, 選填, 當 `waitStrategy` 為 `waitForText` 時必填)
- **`input` 工具**：
  - 參數：`id` (number), `text` (string)
- **`hover` 工具**：
  - 參數：`id` (number)
- **`key` 工具**：
  - 參數：`id` (number, 選填, 用於先 focus 該元素), `key` (string, 鍵名如 `"Enter"`), `waitStrategy` ("waitForNavigation"/"waitForText", **選填**, 無值代表不等待), `expectedText` (string, 選填, 當 `waitStrategy` 為 `waitForText` 時必填)

### 3. 將等待目標抽象化為「等待畫面上出現指定文字 (waitForText)」
- **設計決策**：不侷限於 `waitForToast`，而是採用 `waitForText` 策略，配合 `expectedText` 參數。
- **好處**：無論系統觸發的是 Toast 訊息、Modal 彈出視窗、局部 AJAX 加載的文字段落，只要畫面上出現該指定文字，即認定動作完成。這比單純針對 Toast 更加泛用且實作簡潔。
- **Playwright 實作**：使用 `page.getByText(expectedText).waitFor({ state: "visible", timeout: 5000 })`。

### 4. 使用屬性注入 (Attribute Injection) 定位
- **做法**：在 `observe_web_page` 工具執行時，於瀏覽器端執行 JS，對可見且可互動的元素依序寫入 `data-e2e-agent-id="[ID]"` 屬性。
- **好處**：這樣 Playwright 後端可以直接用簡單的 `[data-e2e-agent-id="ID"]` 進行定位，防錯率高達 100%，完全免去複雜的選擇器計算。

### 5. 動態視覺標籤 (Visual Label Overlay) 的生命週期管理
- **做法**：
  1. `observe_web_page` 執行時，首先清除舊有的標籤。
  2. 計算每個元素的絕對位置（`rect.top + window.scrollY`、`rect.left + window.scrollX`）。
  3. 在 body 最外層追加 CSS，並建立複數個 `.agent-floating-label` 的 `div`。
  4. 截圖並儲存。
  5. 擷取完畢後，立即用 JS 將 `.agent-floating-label` 及對應 CSS 清除，以免干擾使用者檢視或後續操作。

## Risks / Trade-offs

- **[Risk]** 浮動標籤（黃色小貼紙）遮擋了其他元素，導致 AI 無法看清後方文字。
  - **Mitigation**：浮動標籤字體大小設為 `10px`，且一律使用 `pointer-events: none` 確保點擊事件會穿透到下方的實際元素上，並提供選填的 `clean_screenshot` 輔助或讓 LLM 同步對照 Text DOM。
