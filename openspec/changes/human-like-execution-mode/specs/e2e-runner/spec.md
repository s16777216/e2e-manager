## ADDED Requirements

### Requirement: Strategy-based Execution Mode Dispatching
E2E 執行核心 MUST 依據全域設定 `executionMode`，動態選用對應的執行策略：
- 當 `executionMode === "script"` 時，系統 MUST 採用 `ScriptExecutionStrategy`，保留原有的 DOM 數字 ID 標籤注入、`observe_web_page` 黃色貼紙渲染及 9 大基於 ID 的互動工具。
- 當 `executionMode === "human"` 時，系統 MUST 採用 `HumanExecutionStrategy`，改採純原生截圖觀察、不注入 DOM 標籤，並載入基於絕對像素座標與滑鼠/鍵盤原語的擬人工具集。
在兩種模式下，LangGraph 的核心狀態機迴圈（單步重試、Token 記錄、步驟推進與最終斷言）MUST 保持一致。

#### Scenario: Dispatch to script strategy
- **WHEN** 系統啟動測試案例且全域 `executionMode` 為 `"script"` 時
- **THEN** 執行器 MUST 綁定腳本模式工具集與貼紙感知機制，現行 DOM 互動邏輯完整運作

#### Scenario: Dispatch to human strategy
- **WHEN** 系統啟動測試案例且全域 `executionMode` 為 `"human"` 時
- **THEN** 執行器 MUST 綁定擬人模式工具集與純視覺截圖感知機制，不向頁面注入任何 `data-e2e-agent-id` 或貼紙標籤

### Requirement: Pure Visual Perception for Human Mode
在擬人模式下，系統在進行單步決策前，MUST 直接透過瀏覽器擷取當前 Viewport 的原生乾淨截圖，不得注入 DOM 標籤或覆蓋樣式。截圖搭配當前網址、動態視窗尺寸以及步驟目標發送給視覺模型進行推導。

#### Scenario: Capture clean visual screenshot
- **WHEN** 擬人模式執行單步決策感知階段時
- **THEN** 系統擷取不含任何浮動數字貼紙的原生截圖，並作為多模態輸入傳送至執行器模型

### Requirement: Playwright Mouse and Keyboard Action Tools
在擬人模式下，系統 MUST 提供以下專屬操作工具：
1. `mouse_click(x, y, button?, clickCount?, waitStrategy?, expectedText?)`: 點擊指定絕對像素座標，支援左/右/中鍵、雙擊以及非同步導航或文字等待。
2. `mouse_move(x, y)`: 移動滑鼠游標至指定座標（觸發 hover/tooltip）。
3. `mouse_drag(startX, startY, endX, endY)`: 在起點按下左鍵並平滑拖曳至終點後釋放。
4. `mouse_wheel(deltaY, deltaX?)`: 模擬滾輪滾動指定像素距離。
5. `keyboard_type(text, delay?)`: 在目前游標焦點處輸入文字內容。
6. `keyboard_press(key)`: 模擬按下特定鍵位（如 Enter, Escape, Tab）。
以及雙模式共用工具：`navigate_to`, `wait_for_seconds`, `done_acting`。

#### Scenario: Mouse click with wait strategy
- **WHEN** 呼叫 `mouse_click` 傳入 `x: 640, y: 320, waitStrategy: "waitForNavigation"` 時
- **THEN** 系統透過 Playwright 滑鼠在座標 (640, 320) 觸發點擊，並等待頁面載入完成

#### Scenario: Mouse drag action
- **WHEN** 呼叫 `mouse_drag` 傳入 `startX: 100, startY: 200, endX: 300, endY: 200` 時
- **THEN** 系統模擬從 (100, 200) 平滑拖曳至 (300, 200) 並釋放

#### Scenario: Keyboard typing on focused element
- **WHEN** 在滑鼠點擊輸入框後呼叫 `keyboard_type` 傳入 `text: "hello"` 時
- **THEN** 系統透過 Playwright 鍵盤向目前焦點元素輸入 "hello"

### Requirement: Dynamic Viewport Boundary Validation
擬人模式在 System Prompt 中 MUST 動態注入當前瀏覽器的 Viewport 解析度（例如 1280x800 或自訂視窗大小）作為邊界約束。工具層在執行滑鼠動作前，MUST 檢驗傳入之 $(x, y)$ 座標是否落於 `[0, width]` 與 `[0, height]` 範圍內；若超出邊界，工具 MUST 回傳邊界警示訊息引導模型修正，而非直接拋錯崩潰。

#### Scenario: Accept valid coordinates within viewport
- **WHEN** 視窗尺寸為 1280x800 且模型呼叫 `mouse_click(x: 500, y: 400)` 時
- **THEN** 工具校驗通過並正常觸發點擊

#### Scenario: Defend against out-of-bounds coordinates
- **WHEN** 視窗尺寸為 1280x800 且模型呼叫 `mouse_click(x: 1400, y: 900)` 時
- **THEN** 工具攔截執行並回傳明確訊息指出座標超出 1280x800 視窗邊界，引導模型提供有效座標

### Requirement: Virtual Cursor Overlay for Test Logs
在擬人模式執行滑鼠操作時，系統 MUST 在網頁中動態注入可見之虛擬游標標記（紅色指針與點擊波紋），使步驟完成後存入日誌的截圖能夠清晰呈現 AI 點擊與互動的實際位置。在發送給 AI 作為決策依據之感知截圖前，系統 MUST 自動隱藏虛擬游標以避免污染畫面。

#### Scenario: Render virtual cursor on click
- **WHEN** 模型執行 `mouse_click(x: 200, y: 150)` 時
- **THEN** 網頁在座標 (200, 150) 渲染出紅色游標標記，步驟完成所存截圖包含該標記

#### Scenario: Hide virtual cursor before perception
- **WHEN** 系統準備擷取畫面並發送給 AI 進行下一步推理時
- **THEN** 虛擬游標被隱藏，確保 AI 模型接收到的為乾淨原始畫面
