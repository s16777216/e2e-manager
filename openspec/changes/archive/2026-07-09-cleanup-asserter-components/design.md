## Context

在之前的優化中，我們廢除了基於獨立 LLM 的步驟級視覺斷言與全域級視覺斷言（原本的 `asserterNode` 已變為一個自動標記 `PASS` 並關閉瀏覽器的 Stub）。
但代碼中殘留了大量關於 Asserter 的無效邏輯，包括：
1. LangGraph 中存在 `asserter` 節點、`routeNextStep` 方法。
2. 系統設定中提供「斷言器提供者 (asserterProvider)」與「斷言器模型 (asserterModel)」選項。
3. `TestRun` 資料庫實體與 API 界面定義了 `asserterPromptTokens`、`asserterCompletionTokens` 與 `asserterTotalTokens` 欄位。
4. 前端 SSEConsoleView 與 SettingsView 中均有展示/編輯這些無效屬性。

## Goals / Non-Goals

**Goals:**
- 簡化 LangGraph 狀態機結構，移除無用的 `asserter` 節點。
- 從資料庫實體、後端設定服務中拔除 `asserter` 模型與 token 計數屬性，減少過期欄位。
- 從前端 SettingsView 表單、SSEConsoleView 控制台與 API 型別定義中，完全隱藏與清理已廢置的斷言設定與 token 顯示。

**Non-Goals:**
- 不修改 `failureSummary` 邏輯（失敗時的 AI 原因與建議總結仍需保留）。
- 不刪除執行器（Executor）相關的任何功能與配置。

## Decisions

### 1. 簡化 LangGraph 狀態機流程
- **決策**：在 `graph.ts` 中完全移除 `asserterNode`。
- **作法**：
  - 更新路由 `routeNextStep`，當步驟完成時直接回傳 `"reporter"` 代替 `"asserter"`。
  - 將原本 `asserterNode` 中的瀏覽器關閉、狀態置為 `passed` / `PASS`、通知廣播邏輯移至 `reporterNode` 當步驟順利跑完時（即成功路徑）執行。

### 2. 資料庫欄位變更 (Schema & Migration)
- **決策**：在 TypeORM 實體 `SystemSetting` 中的 `aiConfig` 與 `TestRun` 實體中，移除 `asserter` 相關屬性。
- **備案考慮**：直接在 `aiConfig` 的 jsonb 欄位與 `TestRun` 的實體定義中將其標記為 deprecated 或移除。為避免資料庫遷移 (migration) 產生太大的不相容性，我們在開發環境可使用 `npm run typeorm schema:sync` 或 TypeORM 的 `synchronize: true` 來同步。

### 3. 前端 UI 清除
- **決策**：修改 `SettingsView.tsx`，移除「斷言器供應商」與「Gemini/OpenAI Asserter 模型」的 FormField。
- **決策**：修改 `SSEConsoleView.tsx`，移除 Asserter Token 耗用的 UI 區塊，僅保留 Total Tokens 消耗統計。

## Risks / Trade-offs

- **[Risk]** 資料庫欄位移除對舊有 `TestRun` 資料的影響。
  - **Mitigation**：如果資料庫中本來就沒對 `asserterPromptTokens` 做強約束（預設值為 0 且 nullable 可為 0），則在型別定義中移除即可。TypeORM schema 同步會自動將實體欄位刪除。
