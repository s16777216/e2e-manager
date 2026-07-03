## 1. Setup & Dependencies

- [ ] 1.1 於 [`backend/package.json`](file:///c:/works/e2e-manager-ts/backend/package.json) 中添加 `@browserbasehq/stagehand` 與 `@langchain/community` 並進行安裝。
- [ ] 1.2 在 `backend/.env` 中新增並驗證 Stagehand 執行所需要的環境變數（如 `STAGEHAND_API_KEY` 或自訂 Gemini 參數）。

## 2. Browser Manager Refactoring

- [ ] 2.1 重構 [`backend/src/browser.ts`](file:///c:/works/e2e-manager-ts/backend/src/browser.ts)，將原本 Playwright chromium 啟動邏輯換成 Stagehand 的初始化，並託管 Stagehand Page 實例。
- [ ] 2.2 在 `BrowserManager` 中暴露 Stagehand 底層 Playwright 的 `Page` 物件，確保截圖功能 `getPageScreenshotBase64` 能繼續正常運作。

## 3. Graph Logic Rebuilding

- [ ] 3.1 重構 [`backend/src/graph.ts`](file:///c:/works/e2e-manager-ts/backend/src/graph.ts) 引入 `StagehandToolkit`，並在 `create` 工廠方法中透過 `StagehandToolkit.fromStagehand(stagehand)` 載入官方工具。
- [ ] 3.2 在 `executorNode` 執行與 Tool-calling 過程中監聽 ToolCall 事件，當呼叫 `stagehand_act`、`stagehand_navigate` 等工具時，自動截取其參數寫入日誌，並透過 `pg_notify` 即時推送至前端 Timeline。
- [ ] 3.3 修改 `graph.ts` 中的步驟與最終斷言邏輯，改為使用 `stagehand_observe` 工具或直接呼叫 Stagehand 的 `observe` 方法。

## 4. Code Cleanup & Verification

- [ ] 4.1 刪除無用的工具檔 [`backend/src/tools.ts`](file:///c:/works/e2e-manager-ts/backend/src/tools.ts) 及 [`backend/src/browser/selector.ts`](file:///c:/works/e2e-manager-ts/backend/src/browser/selector.ts)。
- [ ] 4.2 啟動伺服器，執行測試劇本，並驗證前端 Dashboard 上 Timeline 日誌推播、截圖及斷言結果是否均能正常顯示。
