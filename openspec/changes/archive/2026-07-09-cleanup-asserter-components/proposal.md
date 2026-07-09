## Why

在之前的架構演進中，專案已完全廢置了單步視覺斷言（`step_asserterNode`）與全局視覺斷言（`asserterNode` 的 LLM 判定）。原先用於執行這些斷言的 `asserterProvider` 與 `asserterModel` 已無實際用途，且 `asserterNode` 已淪為僅執行瀏覽器關閉與狀態標記的 Dummy Node。
為了簡化系統設計、消除無效的 AI 設定選項以符合現有的設計意圖，我們需要進行深度整理：移除 LangGraph 狀態機中的 `asserter` 節點、從系統設定 UI 中拔除斷言器模型的配置，並清理相關的 Token 統計欄位。

## What Changes

- **BREAKING**: 廢棄並移除 LangGraph 狀態機中的獨立 `asserter` 節點及相關路由器方法（如 `routeNextStep`），將測試成功完成時的瀏覽器關閉、狀態寫入與 SSE 廣播整合至 `reporter` 節點。
- **BREAKING**: 從全域系統設定（UI 及資料庫設定物件）中徹底拔除 `asserterProvider`、`asserterModel`、`openaiAsserterModel` 等欄位配置。
- 移除 LLM 工廠中未被調用的 `getAsserterModel` 方法（已在先前手動刪除，在此確認）。
- 從 `TestRun` 資料庫實體與 API 傳輸型別中，移除無效的 `asserterPromptTokens`、`asserterCompletionTokens` 與 `asserterTotalTokens` 欄位（以總 tokens `totalTokens` 系列為主）。
- 從前端監控主控台 UI（`SSEConsoleView.tsx`）中移除無效的 Asserter token 耗用顯示區塊。

## Capabilities

### New Capabilities
<!-- 無 -->

### Modified Capabilities
- `e2e-runner`: 變更測試執行狀態機結構，完全移除 `asserterNode` 節點，由 `step_tracker` 判定步驟結束後直接路由至 `reporter` 進行成功收尾。
- `system-settings`: 變更設定持久化規格，移除斷言器提供者（`asserterProvider`）與斷言器模型之相關配置、校驗與欄位。

## Impact

- **後端執行核心** (`backend/src/graph.ts` & `backend/src/graph/router.ts`):
  - 移除 `asserterNode` 及其關聯的 LangGraph 節點定義與邊。
  - 修改 `routeNextStep` 改為 `routeAfterStepTracking`（或直接在條件邊中決定），完成時直接導向 `reporter`。
  - 將成功時的瀏覽器關閉與 TestRun 寫入 PASS 邏輯遷移至 `reporterNode`。
- **後端資料與 API 實體** (`backend/src/entities/TestRun.ts`, `backend/src/entities/SystemSetting.ts`):
  - 移除實體中與 `asserter` 相關的 token 欄位與 config 屬性。
  - 更新資料庫遷移或 schema 同步。
- **前端設定與監控介面** (`frontend/src/views/SettingsView.tsx`, `frontend/src/views/SSEConsoleView.tsx`, `frontend/src/types/api.ts`):
  - 移除 UI 中的 asserter 模型選擇器與 Token 顯示。
