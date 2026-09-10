## 1. 資料庫模型與全域設定 (System Setting & Persistence)

- [ ] 1.1 修改 `backend/src/entities/SystemSetting.ts`，新增 `executionMode` 欄位（`"script" | "human"`，預設 `"script"`）並更新資料庫持久化邏輯。
- [ ] 1.2 修改 `backend/src/routes/settings.ts` 與 `backend/src/services/settingsService.ts`，支援讀取與更新 `executionMode`。
- [ ] 1.3 在 `settings.ts` 的 `POST /api/settings` 中加入視覺模型校驗：當欲設定 `executionMode: "human"` 時，檢查 `executorModelId` 對應的 `ModelSetting` 是否具備視覺能力，非視覺模型則回傳 400 錯誤。
- [ ] 1.4 在前端設定頁面（`frontend/src/pages/Settings.tsx` 或對應組件）新增「執行模式」切換開關或選項（腳本模式 / 擬人模式），並綁定設定更新與防呆提示。

## 2. 策略模式與擬人工具集實作 (Execution Strategies & Human Tools)

- [ ] 2.1 建立 `backend/src/graph/strategies/ExecutionStrategy.ts` 介面，規範 `getTools`、`getPerception`、`buildPrompt` 與 `mode` 規格。
- [ ] 2.2 實作 `backend/src/graph/strategies/ScriptExecutionStrategy.ts`，將既有的 DOM ID 注入、`observe_web_page` 黃底貼紙與 9 大基於 ID 的工具完整封裝，確保向下相容零回歸。
- [ ] 2.3 實作擬人模式專屬工具集 `backend/src/tools/humanTools.ts`，包含 `mouse_click`、`mouse_move`、`mouse_drag`、`mouse_wheel`、`keyboard_type`、`keyboard_press`，以及通用的 `navigate_to`、`wait_for_seconds`、`done_acting`。
- [ ] 2.4 在 `humanTools.ts` 各滑鼠工具中加入動態 Viewport 邊界檢查，若座標超出視窗範圍則回傳防禦性修正提示，避免例外崩潰。
- [ ] 2.5 實作擬人化提示詞建構函式 `buildHumanExecutorPrompt`（於 `backend/src/graph/prompt.ts`），動態注入 Viewport 尺寸與絕對像素座標規則。
- [ ] 2.6 實作 `backend/src/graph/strategies/HumanExecutionStrategy.ts`，封裝原生乾淨截圖感知（無 DOM 標籤）、擬人工具集與擬人 Prompt。

## 3. 虛擬游標與視覺軌跡反饋 (Virtual Cursor & Visual Feedback)

- [ ] 3.1 在 `BrowserManager`（`backend/src/browser.ts`）中實作虛擬游標注入與控制邏輯（`injectVirtualCursor(x, y)`、`hideVirtualCursor()`），透過 CSS 與 DOM 元素渲染紅色指針與水波紋動畫。
- [ ] 3.2 串接 `mouse_click` 與 `mouse_move` 工具，在操作時呼叫虛擬游標更新位置，確保步驟完成截圖自然記錄游標軌跡。
- [ ] 3.3 在 `HumanExecutionStrategy.getPerception` 擷取 AI 決策截圖前呼叫 `hideVirtualCursor()`，確保傳送給模型的畫面保持純淨。

## 4. 執行核心整合與狀態防禦 (E2EGraphBuilder Integration & Guardrails)

- [ ] 4.1 修改 `backend/src/graph.ts` 的 `E2EGraphBuilder.create()`，依據全域 `executionMode` 動態實例化對應的 Strategy。
- [ ] 4.2 在 `E2EGraphBuilder.create()` 中加入執行期硬性防護：若當前為 `human` 模式但執行器模型不具備視覺能力，阻止任務啟動並拋出明確錯誤。
- [ ] 4.3 重構 `executorNode` 邏輯，改由當前 strategy 提供感知輸入、Prompt 與工具列表，維持單一 LangGraph 狀態機迴圈。
- [ ] 4.4 確保在 `human` 模式下步驟失敗時，`reporterNode` 與步驟日誌能正確記錄帶有虛擬游標的畫面與操作紀錄。

## 5. 驗證與測試 (Verification & Testing)

- [ ] 5.1 撰寫單元測試驗證 `executionMode` 全域設定讀寫與非視覺模型的防呆阻擋。
- [ ] 5.2 撰寫單元測試驗證 `HumanExecutionStrategy` 工具集的 Viewport 邊界校驗與防禦修復反饋。
- [ ] 5.3 執行整合測試案例，分別以「腳本模式」與「擬人模式」運行實際 Web 測試，確認滑鼠點擊、游標視覺標記與整體執行流暢度。
