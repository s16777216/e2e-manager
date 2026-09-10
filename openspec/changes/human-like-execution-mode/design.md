## Context

目前 Autape 的執行核心 `E2EGraphBuilder`（於 `backend/src/graph.ts`）在 `executorNode` 中直接綁定由 `BrowserTools` 提供的一組靜態工具（9 個基於 DOM ID 的工具），並預設在每一步執行 `observeWebPage()` 進行 DOM 標籤注入與黃底黑字貼紙繪製。

依據使用者確認的架構決策（純視覺座標、全域配置、保留現有腳本模式），我們需要將執行器改為策略模式（Strategy Pattern），在不破壞現有腳本模式與 LangGraph 狀態機（`initNode` -> `executorNode` -> `stepTrackerNode` -> `reporterNode`）的前提下，引進獨立的擬人化視覺互動工具集。

## Goals / Non-Goals

**Goals:**
- 在 `SystemSetting` 新增 `executionMode: "script" | "human"`（預設 `"script"`），於系統設定介面提供切換。
- 當啟用 `human` 模式時，在前後端皆實施視覺模型約束（要求 `executorModelId` 必須為具備多模態視覺能力的模型）。
- 實作 `ExecutionStrategy` 介面，將 `ScriptExecutionStrategy`（封裝現有 DOM ID 感知、黃色貼紙與 9 大工具）與 `HumanExecutionStrategy`（封裝純截圖、Playwright Mouse/Keyboard 原語與新 Prompt）解耦。
- 採用絕對像素座標系統，以動態 Viewport 解析度（讀取當前 Playwright Page 實例之 `viewportSize()`）作為約束邊界注入 Prompt，並在工具層實作邊界校驗與防禦修復反饋。
- 實作輕量級虛擬游標（Virtual Cursor）機制，在滑鼠點擊/移動時渲染視覺標記，使 TestLog 的步驟截圖中能清楚呈現 AI 游標點擊位置，且在決策截圖前隱藏以保證模型視野純淨。

**Non-Goals:**
- 支援測試案例（Testcase）級別或單步驟級別的執行模式覆寫（本次聚焦於系統全域配置）。
- 支援 0~1000 歸一化比例座標（已確認採用絕對像素座標與動態視窗綁定）。
- 修改 LangGraph 狀態機結構、步驟重試計數、Token 計量或 `reporterNode` 流程。

## Decisions

### 1. 策略模式架構 (Strategy Pattern for Dual Modes)
- **決策**：在 `backend/src/graph/` 下建立 `strategies/`，定義統一的 `ExecutionStrategy` 介面：
  ```ts
  export interface ExecutionStrategy {
    mode: "script" | "human";
    getTools(): ClientTool[];
    getPerception(browserManager: BrowserManager): Promise<{
      screenshotBase64: string;
      contextText: string;
    }>;
    buildPrompt(params: {
      testName: string;
      stepIdx: number;
      stepContent: string;
      stepExpected?: string;
      currentUrl: string;
      systemPrompt?: string;
      viewport: { width: number; height: number };
    }): string;
  }
  ```
- **理由**：
  - `executorNode` 只需要呼叫 `this.strategy.getPerception()` 與 `this.strategy.buildPrompt()`，並執行 `this.strategy.getTools()`。
  - 腳本模式（`ScriptExecutionStrategy`）完整封裝既有的 DOM ID 注入、`observe_web_page` 與 `click`/`input`/`key` 工具，零回歸風險。
  - 擬人模式（`HumanExecutionStrategy`）獨立封裝原生乾淨截圖與滑鼠/鍵盤工具，邏輯完全隔離。

### 2. 絕對像素座標與動態視窗邊界約束 (Dynamic Viewport Coordinates)
- **決策**：
  - 視窗大小不寫死固定數值，以當前 Playwright Page 的 `viewportSize()` 為準（fallback 至資料庫 `viewportWidth`/`viewportHeight`）。
  - 在 `HumanExecutionStrategy.buildPrompt` 中動態填入目前寬高（例如 `1280 x 800` 或使用者自訂尺寸），提示模型座標有效區間為 `[0, width]` 與 `[0, height]`。
  - 在 `mouse_click`、`mouse_move`、`mouse_drag` 工具中加入邊界檢查：若座標小於 0 或大於寬高，工具不拋出例外崩潰，而是回傳警告文字（例如：`"座標 (1300, 500) 超出視窗邊界 (1280x800)，請重新觀察並提供有效座標"`），引導 Agent 在下一個 turn 修正。
- **備選方案與理由**：
  - 備選：千分比歸一化座標（0~1000）。使用者決策確認使用絕對像素，因為可以直接映射 Playwright API，減少小數點換算精度誤差與浮點數歧義。

### 3. 擬人模式專屬工具集 (Human-like Toolkit)
- **決策**：在 `backend/src/tools/humanTools.ts` 中實作以下工具：
  1. `mouse_click(x, y, button?, clickCount?, waitStrategy?, expectedText?)`：
     - 使用 `page.mouse.click(x, y)`。支援 `button: "left" | "right" | "middle"`、`clickCount`（雙擊設 2）。
     - 整合 `waitStrategy: "waitForNavigation" | "waitForText"`，保留動作即驗證機制。
  2. `mouse_move(x, y)`：使用 `page.mouse.move(x, y, { steps: 5 })`，平滑模擬移動以觸發 Hover 狀態。
  3. `mouse_drag(startX, startY, endX, endY)`：按序執行 `move(startX, startY)` -> `down()` -> `move(endX, endY, { steps: 10 })` -> `up()`。
  4. `mouse_wheel(deltaY, deltaX?)`：使用 `page.mouse.wheel(deltaX || 0, deltaY)` 進行頁面滾動。
  5. `keyboard_type(text, delay?)`：在當前游標焦點處調用 `page.keyboard.type(text)`。
  6. `keyboard_press(key)`：調用 `page.keyboard.press(key)`（支援 Enter, Tab, Escape, Backspace 等）。
  7. 雙模式通用工具：`navigate_to`, `wait_for_seconds`, `done_acting`。

### 4. 虛擬游標注入與視覺軌跡 (Virtual Cursor Logging)
- **決策**：
  - 在執行任何滑鼠動作時，透過 `page.evaluate()` 於網頁注入或移動一個帶有 `#autape-virtual-cursor` 的固定定位 DOM 元素（包含紅色圓點指針與點擊水波紋效果）。
  - 當步驟結束擷取結果截圖（`stepTrackerNode`）時，截圖自然帶有該紅點標記，呈現在日誌與 Console 畫面上。
  - 在模型推導感知環節（`getPerception`）擷取決策截圖前，先透過 `style.display = 'none'` 隱藏虛擬游標，防止游標被模型誤認為頁面內建元件。

### 5. 全域設定與視覺模型強約束 (Global Setting & Vision Model Constraint)
- **決策**：
  - `SystemSetting` Entity 新增 `@Column("varchar", { default: "script" }) executionMode: "script" | "human"`。
  - 前端設定頁面的「AI 核心配置」新增執行模式切換開關。
  - 模型強約束校驗：
    - `POST /api/settings`：若請求欲將 `executionMode` 設為 `human`，後端查詢 `aiConfig.executorModelId` 對應的 `ModelSetting`；若該模型未支援視覺（或 provider 設定為純文字），回傳 400 錯誤。
    - `E2EGraphBuilder.create()`：若目前為 `human` 模式且 `executorModelSetting` 不具備多模態能力，阻止任務啟動並拋出明確異常。

## Risks / Trade-offs

- **視覺模型座標判定偏差 (Coordinate Inaccuracy)**：
  - *風險*：部分較小尺寸的模型對精確像素座標敏感度不足，可能點擊偏離按鈕邊緣數十像素。
  - *緩解措施*：提示詞明確給定 Viewport 邊界並要求鎖定按鈕中心點；支援重試機制與虛擬游標日誌，便於人工即時肉眼比對。
- **非 Focus 狀態下的鍵盤輸入 (Typing without Focus)**：
  - *風險*：擬人模式下 `keyboard_type` 無法像 DOM `fill(selector)` 一樣自動定位元素，若模型未先 click 該輸入框，打字可能落空。
  - *緩解措施*：在 Prompt 的 Instructions 中列為核心規則（"You MUST mouse_click the input field to focus it before using keyboard_type"）。
