## Context

原本在 `E2EGraphBuilder` 中，每個步驟都需要擷取畫面並傳送給 Gemini LLM 進行推理，然後由 LLM 決定呼叫哪些工具。這帶來了高昂的 Token 與時間開銷。
由於目前獨立的視覺斷言已被廢棄，系統採用「動作即驗證」原則，將預期結果等待邏輯內建於 Playwright 工具的 `waitStrategy` 中。
此設計提供了一個使用極簡 ID 重放的契機：只要畫面結構沒有變動，JS 注入所產生的元素 ID 就是完全決定性（Deterministic）的。我們可以直接重放上一次成功的工具日誌（含相同 ID），並透過 Playwright 的原生等待與異常捕獲，在重放失效時自動 fallback 至 LLM Agent 重新推導，以達成自我修復。

## Goals / Non-Goals

**Goals:**
- 在 `E2EGraphBuilder` 中加入「重放模式 (Replay Mode)」。
- 重放時，跳過 LLM Executor 推導，改為直接依序呼叫上一次成功執行此步驟時的所有工具日誌。
- 透過 `try-catch` 捕獲 Playwright 工具執行時的異常（如找不到元素或等待預期文字逾時），並在異常發生時自動 Fallback 到一般的 LLM 推導模式進行「自我修復」。
- 大幅降低重複執行測試時的 Token 成本。

**Non-Goals:**
- 不修改 `BrowserTools` 的 API Schema，工具繼續以動態 `id` 作為定位參數。
- 不實作複雜的 Selector 產生與 Mapping 翻譯層。
- 不引入額外的視覺斷言比對節點。

## Decisions

### 1. 使用「零翻譯 ID 重放 (Zero-Translation ID Replay)」
- **做法**：在步驟執行前依然執行 `observeWebPage()` 進行 JS 注入分配 ID。如果系統查詢到該測試案例上一次執行為 `passed` 的 `TestLog` 軌跡，則跳過 LLM 呼叫，直接取出舊的 `action` 參數並呼叫 `tool.invoke({ id })`。
- **Rationale**：因為每次 JS 注入是決定性的，在畫面不變時，同一顆按鈕產生的 ID 必定一致。這讓重放不需要任何 CSS Selector/XPath 的轉換和維護。
- **替代方案**：
  - *方案 B (CSS Selector 重放)*：重放時不執行 `observeWebPage()`，而是在第一次執行成功時記錄元素的 CSS Selector，重放時直接以 Selector 操作。缺點是必須重構工具 schema 支援雙軌參數，且在 PixiJS 這類高動態的遊戲引擎 IDE 介面中，自動算出的 CSS Selector 極易因為資料或結構微調而失效，維護成本極高。

### 2. 利用 Playwright 工具執行異常作為重放失敗的判定
- **做法**：重放的工具呼叫被包裹於 `try-catch` 中。若工具執行（例如等待預期文字出現）拋出 `TimeoutError` 等異常，則捕獲該錯誤，將重放日誌清空，並引導流程進入原本的 LLM Agent 推理。
- **Rationale**：在「動作即驗證」的原則下，Playwright 工具在執行時若無法滿足等待條件，會自然拋出異常。因此異常捕獲是最直接、零成本的重放失敗判定。

## Risks / Trade-offs

- **[Risk] ID 偏移點錯按鈕，但沒有拋出異常**
  - *說明*：若 ID 偏移（例如多了一個元素，導致 ID 15 從「登入」按鈕變成了「忘記密碼」按鈕），重放點擊了「忘記密碼」，且因為此點擊不需要等待特定文字，Playwright 順利執行沒有拋出錯誤。此時重放會誤判為成功，並推進到下一步。
  - *Mitigation*：當推進到下一個步驟時，由於畫面已經處於「忘記密碼」頁面，舊紀錄中下一步所期望的操作（例如在 Dashboard 輸入搜尋字串）必然在當前頁面找不到對應的輸入框，此時 Playwright 就會拋出 `TimeoutError` 異常。重放會在該步驟中斷，並觸發 Fallback 切換回 Agent 模式。Agent 會重新 observe 畫面，發現偏離了軌跡，進而引導測試重回正軌或申報失敗。
