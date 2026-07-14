## Why

目前基於 Playwright 的測試執行引擎使用 `observe_web_page` 工具為網頁上的可互動元素標記數字 ID，並要求 Agent 透過標籤 ID 進行點擊與輸入。然而在面對如 PrimeVue / PrimeReact 的 `.p-multiselect-option` 或特定動態 Popover/Portal 選單時，這些選項常因屬於非標準按鈕或微小渲染延遲而被 `observe_web_page` 過濾掉，導致 Agent 在缺少標籤 ID 的情況下無法點擊目標選項並造成測試中斷。追加 `execute_javascript` 工具能提供動態 DOM 腳本執行的備援防線，確保 Agent 可以隨時以 Javascript 代碼操作複雜 DOM 特徵與補救特殊的互動場景。

## What Changes

- **新增 `execute_javascript` 工具**：在 `backend/src/tools.ts` 中提供供 LLM 呼叫的 Javascript 執行工具，允許 Agent 於當前網頁 context 中執行 `page.evaluate()` 並回傳執行結果或 Error 訊息。
- **更新系統提示詞 (System Prompt)**：在 `backend/src/graph/prompt.ts` 的 `# Available Tools` 與指引手冊中，注入 `execute_javascript` 工具說明與動態選單（如 `.p-multiselect-option`）的應對操作指南。

## Capabilities

### New Capabilities
- `execute-javascript-tool`: 提供在執行 E2E 測試流程中，允許 Agent 調用瀏覽器 JavaScript 執行 DOM 點擊、捲動與事件觸發的能力。

### Modified Capabilities

## Impact

- **後端模組**：`backend/src/tools.ts` (新增工具實作), `backend/src/graph/prompt.ts` (工具提示詞更新)。
- **前架與執行依賴**：不影響現有前端 UI，全面向上相容現有測試案例。
