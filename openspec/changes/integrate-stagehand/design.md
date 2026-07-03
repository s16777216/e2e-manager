## Context

目前的 E2E 測試管理器使用自研的 Playwright 管理器及 LangGraph 節點，透過拼裝簡化 DOM 與傳遞截圖給 LLM，引導其呼叫自訂的瀏覽器工具（如點擊、輸入等）。隨著網頁結構變複雜，元素定位常因動態 class 或 Shadow DOM 而失效，導致測試不穩定。我們決定引入 Stagehand（基於 Playwright 的 AI 原生瀏覽器自動化框架）來處理底層的操作與定位，簡化現有架構。

## Goals / Non-Goals

**Goals:**
- 在 `package.json` 中整合 `@browserbasehq/stagehand` 與 `@langchain/community`。
- 在 `E2EGraphBuilder` (LangGraph) 中，使用 `StagehandToolkit.fromStagehand(stagehand)` 產生官方工具集，替換原先自訂的 Playwright 工具。
- 將 Stagehand 的 `stagehand_act`、`stagehand_navigate`、`stagehand_observe` 和 `stagehand_extract` 綁定給執行模型，保持 LangGraph 對工具呼叫生命週期的完整控制與監聽。

**Non-Goals:**
- 修改資料庫結構（保留現有 TestRun、TestRunStep 與 TestLog 實體）。
- 更改前端 UI 頁面設計（僅維持現有日誌事件與數據格式對接）。

## Decisions

### 決策 1：使用 `@langchain/community` 中的 `StagehandToolkit` 作為 Agent 工具集
- **原因**：Stagehand 提供官方的 LangChain 整合。透過 `StagehandToolkit.fromStagehand(stagehand)`，我們可以將 `stagehand_act`、`stagehand_navigate`、`stagehand_observe` 等包裝成標準的 LangChain 格式工具。
- **好處**：我們的 LangGraph 結構不需要改變，AI 模型仍然是透過 Tool-calling 機制去操縱瀏覽器。這也意謂著我們能輕易捕捉每一次 AI 調用 Tool 的輸入參數（例如 `stagehand_act` 的行動描述），並透過 WebSocket 推播給前端 Timeline，解決了「Stagehand 作為黑盒子難以監控」的風險。

### 決策 2：LLM 與 Token 最佳化
- **選擇**：模型採用 `gemini-2.0-flash`。
- **原因**：Stagehand 預設對 OpenAI 與 Anthropic 支援度最佳，但透過 LangChain 的多模態模型接口，我們可以無縫搭配 `ChatGoogleGenerativeAI` 執行工具調用，發揮 Gemini 在 Token 成本與多模態截圖分析上的優勢。

### 決策 3：Timeline 日誌對接與步驟狀態追蹤
- **選擇**：在 LangGraph 執行節點（`executorNode`）中，監聽 ToolCall 事件，當 LLM 呼叫 `stagehand_act` 或 `stagehand_navigate` 時，即時截取參數並寫入資料庫/廣播 `pg_notify`。
- **原因**：因為 Stagehand 工具已被標準化為 LangChain Tool，我們可以透明地捕獲其呼叫細節，讓前端使用者看到像是 "AI 決定執行：stagehand_act (在登入欄位輸入 admin)" 的日誌。

## Risks / Trade-offs

- **[Risk] Stagehand 內部處理可能導致 Tool 呼叫時間變長**
  - **Mitigation**：適當調高每個 LangGraph 步驟的 Timeout 閥值，限制 Stagehand 的操作自癒重試上限。
- **[Risk] Gemini 對 StagehandToolkit 結構化輸出的相容性**
  - **Mitigation**：由於 LangChain Community 的 `StagehandToolkit` 底層使用了 `page.extract` 的結構化 Zod schema，Gemini 2.0 在 `@langchain/google-genai` 下能完整支援 `withStructuredOutput`，但需要我們在開發時針對極複雜 schema 進行測試與 Schema 降級處理。
