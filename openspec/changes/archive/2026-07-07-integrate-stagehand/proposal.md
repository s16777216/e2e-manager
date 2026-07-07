## Why

目前的 AI 瀏覽器 E2E 測試流程依賴自研的簡化 DOM 擷取演算法與自定義的 Playwright 工具鏈。然而，這種做法對於複雜的網頁 UI（如動態 class、Shadow DOM 或網頁結構改變）容易出現定位不準或測試脆弱（Brittle Tests）的情況，且每次都需要自行調整 prompt。
引入 Stagehand 可以利用其內建的 AI 驅動觀察者與操作器，大幅提升元素定位的自癒能力（Self-healing），簡化 AI agent 設計，並透過 A11y 樹優化 LLM Token 消耗。

## What Changes

- **引入 Stagehand SDK & LangChain 社群套件**：添加 `@browserbasehq/stagehand` 與 `@langchain/community` 依賴並配置其初始化流程。
- **使用 StagehandToolkit 替換自訂工具**：不再手動維護自訂的 Playwright 工具，改為透過 `StagehandToolkit.fromStagehand(stagehand)` 產生 LangChain 官方整合的 `stagehand_navigate`、`stagehand_act`、`stagehand_observe` 與 `stagehand_extract` 工具集。
- **簡化 Agent 決策流程**：修改 [`E2EGraphBuilder`](file:///c:/works/e2e-manager-ts/backend/src/graph.ts)，將 Stagehand Toolkit 的工具集直接綁定至 Executor 模型，讓 AI 能夠自主決策呼叫語意化的 Stagehand 工具，免去傳統 Selector 的限制，同時維持 LangGraph 的流程控制。
- **移除自訂 Selector 算法與工具檔**：刪除 [`selector.ts`](file:///c:/works/e2e-manager-ts/backend/src/browser/selector.ts) 及 [`tools.ts`](file:///c:/works/e2e-manager-ts/backend/src/tools.ts)。

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. -->

### Modified Capabilities
- `ts-step-by-step-runner`: 替換基於 Playwright 工具與 LLM 決策迴圈的單步執行機制，改為委託 Stagehand `page.act`。
- `ts-step-assertion-and-reporting`: 使用 Stagehand 內建 of `page.observe` 來進行步驟與最終斷言驗證，並透過 Stagehand 包裝的 Playwright 實例繼續擷取截圖與渲染測試報告。

## Impact

- **依賴套件**：新增 `@browserbasehq/stagehand` 依賴。
- **程式碼刪除**：刪除 [`backend/src/tools.ts`](file:///c:/works/e2e-manager-ts/backend/src/tools.ts) 及 [`backend/src/browser/selector.ts`](file:///c:/works/e2e-manager-ts/backend/src/browser/selector.ts)。
- **即時日誌**：原先的步驟詳細工具呼叫日誌（例如「點擊 `button[id="login"]`」）在完全切換至 Stagehand 後將被其內部隱藏，需要透過 Stagehand 的內部 logger 自訂對接來獲取，以防前端 Timeline 日誌遺失。
- **API 成本**：每個步驟的 API Token 消耗模式會改變，改由 Stagehand 的 A11y 提取與 AI 觀察器所決定。
