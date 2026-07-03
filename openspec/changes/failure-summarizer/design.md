## Context

目前 E2E Manager 在驗收測試失敗（FAIL）或異常（ERROR）時，僅提供簡短的斷言說明或預設錯誤字串。使用者若想排除錯誤，必須展開測試報告中的所有執行步驟，逐一查看每個步驟的 AI 推理日誌、工具呼叫結果，甚至去對比逐步截圖。這對工程師的除錯流程相當繁瑣。

為此，我們設計了「AI 失敗原因總結（Failure Summarizer）」功能，在測試流程異常終止或視覺斷言失敗時，透過專屬的 LLM 提示詞來統整執行歷史與最後的瀏覽器畫面，生成繁體中文（Traditional Chinese）的失敗摘要分析與具體改善建議，並將其展示於前端與測試報告中。

## Goals / Non-Goals

**Goals:**
- 自動於 E2E 測試失敗或出錯時，整合步驟日誌與最後畫面生成高可讀性的 AI 失敗原因分析。
- 提供 Traditional Chinese 的「失敗步驟」、「原因分析」與「改善建議」。
- 於 `TestRun` 實體與資料庫儲存並持久化該總結。
- 透過 SSE 即時將總結推送到前端，並在 `SSEConsoleView` 和 `TestCaseDetailView` 展示。
- 將失敗總結嵌入至生成好的 Markdown 測試報告中。

**Non-Goals:**
- 不對「成功（PASS）」的測試案例進行失敗總結（節省 LLM 資源）。
- 不在瀏覽器完全無法初始化或連線時（例如資料庫死鎖或 Node.js 執行崩潰等極端環境錯誤）進行 LLM 畫面分析，只寫入基礎 crash error 報告。

## Decisions

### 決策 1：呼叫失敗總結器（Failure Summarizer）的時機與位置
在測試工作流（LangGraph）的 **`reporterNode`** 結尾進行處理。

- **理由**：
  - `reporterNode` 是所有測試執行的終點節點（無論是在步驟執行期間重試超限直接跳轉到 `reporter`，抑或是跑完所有步驟進入 `asserter` 判定為 FAIL 後進入 `reporter`）。
  - 在 `reporterNode` 執行時，所有的 `state.logs` 與截圖資料均已收集完畢，適合在此發送統一的總結請求。
  - 對於 `asserterNode` 判定為 FAIL 的情況，亦在此節點分析「預期與實際畫面不符」的原因。

### 決策 2：LLM 總結模型配置與 Prompt 設計
我們將在 `backend/src/services/llmFactory.ts` 中新增 `getSummarizerModel(aiConfig)`，使用無繫結 Tools 的 LLM 模型，配置 Temperature 為 `0.2`。

- **系統提示詞 (System Prompt)**：
  - 任務：分析 AI E2E 驗收測試的失敗原因。
  - 輸入：測試案例的步驟描述與預期結果、各步驟已呼叫的工具及其執行結果（JSON logs）、最後失敗時的網頁畫面的 Base64 截圖。
  - 輸出格式：Traditional Chinese Markdown。
  - 結構要求：
    - ❌ **失敗步驟**：指出是哪一個步驟失敗（第 n 步）。
    - 🔍 **根本原因分析**：說明為何失敗（如：元素未出現、預期文字不符合、網頁跳轉錯誤等）。
    - 💡 **修復建議**：給出具體的解決指南（如：確認 selector 屬性、增加延遲或前置條件、修正預期文字等）。

- **圖片多模態輸入**：若有最終失敗截圖，應將截圖以 `image_url` 傳入 LLM 以提高 UI 斷言失敗或定位失敗的精準度。

### 決策 3：資料庫與 API 擴展
- **資料庫**：在 `TestRun` 實體新增 `@Column("text", { nullable: true }) failureSummary?: string;`。TypeORM 的 `synchronize: true` 會自動更新 Postgres 表結構。
- **API 路由**：更新 `runRouter.get("/runs/:runId")`，在回傳的 JSON 中加入 `failureSummary`。
- **SSE 機制**：在 `graph.ts` 中發送 `completed` 事件的 `pg_notify` payload 中加入 `failureSummary` 屬性。

### 決策 4：前端 UI 面板展示
- 於 `frontend/src/views/SSEConsoleView.tsx` 與 `frontend/src/features/projects/pages/TestCaseDetailView.tsx` 新增一個 `AI 失敗原因分析與修復建議` 面板。
- 面板使用 `bg-rose-950/20 border-rose-500/30 text-rose-200` 等設計，配合 Lucide 圖標（如 `XCircle`, `AlertCircle`）提供極具科技感與現代感的 Premium Bento Card UI。
- 使用 Markdown 渲染器（`react-markdown` 或既有渲染器，或以 CSS 排版呈現）來漂亮地顯示 LLM 回傳的 Markdown 結構。

## Risks / Trade-offs

- **[Risk] LLM 呼叫增加額外 Token 消耗與延遲**
  - **Mitigation**: 僅在 `FAIL` 或 `ERROR` 的測試中呼叫總結器。成功的測試案例完全不呼叫，避免不必要的額外費用與延遲。
- **[Risk] 瀏覽器崩潰時無法獲取截圖**
  - **Mitigation**: 當發生執行崩潰（如 `executeJob` catch 異常）或截圖失敗時，總結器將回退（Fallback）為純文字模式（僅分析 logs 與 exception error 訊息），不發送 `image_url`，確保不會因截圖異常而導致整個失敗報表寫入中斷。
