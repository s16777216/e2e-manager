## Why

目前 Autape 的 E2E 測試完全依賴「腳本模式（Script Mode）」：透過向頁面注入 `data-e2e-agent-id`、生成黃底黑字浮動貼紙與 DOM 元素清單來進行推導與點擊。然而，現代 Web 應用大量採用 Canvas、WebGL、複雜 SVG、動態 Shadow DOM、拖拉排序（Drag & Drop）以及滑塊驗證等元件，這些元件在 DOM 層無法被提取或打上精確的數字 ID 標籤，導致自動化測試受阻。此外，頻繁注入 DOM 亦有干擾原始頁面樣式與被抗自動化機制識別的風險。

為了擴展測試能力，我們需要引入「擬人模式（Human-like Mode）」。透過純視覺模型直接觀察未被 DOM 污染的乾淨截圖，並以絕對像素座標操控 Playwright 底層的 `page.mouse` 與 `page.keyboard` 原語，模擬真實人類使用者在畫面上移動、點擊、拖曳與滾動。同時，保留穩定的腳本模式並透過全域設定進行模式切換，讓不同類型的測試場景能自由選擇最合適的執行策略。

## What Changes

- **全域執行模式設定 (Global Execution Mode)**：在 `SystemSetting` 中新增 `executionMode` 欄位（`"script" | "human"`，預設 `"script"`），控制 Runner 的全局執行策略。
- **視覺模型硬性約束**：當全域模式設定為 `human` 時，要求所選的執行器模型（`executorModelId`）必須具備視覺多模態能力；若配置純文字模型，系統將在儲存設定與執行期進行防禦攔截。
- **保留現有腳本模式 (Preserve Script Mode)**：既有的 DOM ID 注入、`observe_web_page` 貼紙機制及 9 大基於 ID 的工具完整保留，不受影響。
- **引入擬人模式工具集 (Human-like Toolkit)**：
  - `mouse_click(x, y, button?, clickCount?, waitStrategy?, expectedText?)`
  - `mouse_move(x, y)`
  - `mouse_drag(startX, startY, endX, endY)`
  - `mouse_wheel(deltaY, deltaX?)`
  - `keyboard_type(text, delay?)`
  - `keyboard_press(key)`
  - 雙模式通用工具：`navigate_to`, `wait_for_seconds`, `done_acting`
- **動態視窗與絕對像素約束 (Dynamic Viewport Coordinates)**：
  - 座標系統採用絕對像素，動態讀取當前瀏覽器 Viewport 寬高（`viewportWidth`, `viewportHeight`），不寫死任何固定解析度。
  - 在 System Prompt 中動態注入邊界約束，並在工具層實作防禦邊界校驗，若超出視窗範圍則回傳修復指引而非崩潰。
- **虛擬游標日誌視覺回饋 (Virtual Cursor Feedback)**：
  - 在擬人模式執行滑鼠點擊/移動動作時，動態在頁面上注入輕量級虛擬游標（紅色圓點與波紋動畫），使步驟截圖可清晰看見 AI 點擊的軌跡位置，方便日誌排查。
  - 在發送截圖給 AI 決策前自動隱藏游標，確保模型觀察到的頁面保持純淨。
- **架構重構（策略模式 Strategy Pattern）**：
  - 在 `backend/src/graph/` 下引入執行策略模式，將感知（Perception）、工具集（Tools）與提示詞（Prompt）解耦為 `ScriptExecutionStrategy` 與 `HumanExecutionStrategy`。
  - `executorNode` 保持核心單一步驟迴圈、Token 計費與重試邏輯不變。

## Capabilities

### New Capabilities
（無新增獨立 capability，既有核心能力已由 `e2e-runner` 與 `system-settings` 涵蓋）

### Modified Capabilities
- `system-settings`: 新增 `executionMode` 全域設定，支援 `"script"` 與 `"human"`，並加入視覺模型強制校驗機制。
- `e2e-runner`: 擴充 E2E 執行核心以支援擬人模式（純視覺座標、Playwright Mouse/Keyboard 原語、動態 Viewport 注入、虛擬游標視覺回饋與雙模式策略切換）。

## Impact

- **後端資料庫**：`SystemSetting` 表新增 `executionMode` 欄位（預設 `"script"`，向下相容）。
- **後端執行核心**：`E2EGraphBuilder` 與 `executorNode` 解耦為 Strategy 模式，新增擬人模式專屬工具與 Prompt。
- **前端介面**：系統設定頁面新增「執行模式」切換開關或下拉選單，並在選取擬人模式時進行模型視覺能力校驗。
