## Context

原本在 `E2EGraphBuilder` 中，每個步驟都需要擷取畫面並傳送給 Gemini LLM 進行推理，然後由 LLM 決定呼叫哪些工具。這帶來了高昂的 Token 與時間開銷。
由於目前獨立的視覺斷言已被廢棄，系統採用「動作即驗證」原則，將預期結果等待邏輯內建於 Playwright 工具的 `waitStrategy` 中。
此設計提供了一個使用極簡 ID 重放的契機：只要畫面結構沒有變動，JS 注入所產生的元素 ID 就是完全決定性（Deterministic）的。我們可以直接重放上一次成功的工具日誌（含相同 ID），並透過回傳結果檢驗與異常捕獲，在重放失效時自動 fallback 至 LLM Agent 重新推導，以達成自我修復。

## Goals / Non-Goals

**Goals:**
- 在 `E2EGraphBuilder` 中加入「重放模式 (Replay Mode)」。
- 重放時，跳過 LLM Executor 推導，改為直接依序呼叫上一次相同測試案例版本（`testcaseVersion`）成功執行時的所有工具日誌。
- 透過回傳字串檢查、2000ms 快速超時與 `try-catch` 捕獲失敗，自動 Fallback 到一般的 LLM 推導模式進行「自我修復」。
- 大幅降低重複執行測試時的 Token 成本（重放步驟 0 Token）。
- 在 `SystemSetting` 提供全域重放開關。

**Non-Goals:**
- 不修改 `BrowserTools` 的 API Schema，工具繼續以動態 `id` 作為定位參數。
- 不實作複雜的 Selector 產生與 Mapping 翻譯層。
- 不引入額外的視覺斷言比對節點。

## Decisions

### 1. 使用「版本驅動之零翻譯 ID 重放 (Version-driven Zero-Translation ID Replay)」
- **做法**：
  1. `Testcase` 引入 TypeORM `@VersionColumn({ default: 1 }) version`，當步驟、提示詞或變數更新時自動 +1。
  2. `TestRun` 記錄 `testcaseVersion`。重放查詢時要求 `run.testcaseVersion === state.testcase_version` 且 `status === 'passed'`，若版本不一致則視為未命中，由 LLM 重新學習。
  3. 在重放執行時，若工具調用需要 `id` 參數，或在執行 `navigate_to` / 導航等待後，自動調用 `observeWebPage()` 刷新當前頁面的 DOM ID，確保後續操作能精準命中元素。
- **Rationale**：每次 JS 注入具備決定性，版本號則為步驟變更提供了最安全的防護盾，免除 CSS Selector/XPath 的維護包袱。

### 2. 「字串特徵檢查 + 2000ms 快速超時」之失敗判定機制
- **做法**：
  1. 工具調用結果字串檢查：若包含「`失敗`」或開頭為「`錯誤`」，直接視同執行失敗。
  2. 縮短超時：重放模式下的元素等待時間縮短為 2000ms（一般模式為 5000ms），一旦逾時立刻判定失敗。
  3. 搭配 `try-catch` 捕捉未預期之底層例外。
- **Rationale**：Playwright 工具封裝層已內部 catch 異常並轉為字串回傳，純靠 `try-catch` 無法攔截失敗。縮短超時則可消除等待卡頓感，迅速啟動自我修復。

### 3. 自我修復交棒現場：保留瀏覽器畫面、拋棄暫存、重試歸零
- **做法**：當重放失敗時：
  1. 瀏覽器當前畫面維持不變（不可逆操作保留）。
  2. 清空當前步驟已累積之重放暫存日誌。
  3. 將單步重試計數重設為 `step_retry_count = 0`。
  4. 立即呼叫 `observeWebPage()` 取得當前真實畫面與元素清單，交棒給 LLM Executor 繼續執行推導。
- **Rationale**：不浪費已完成的操作進度，同時給予 LLM 完整的 5 次重試容錯空間，實作最乾淨且穩定。

### 4. 全域開關（enableReplay）與逃生閥
- **做法**：在 `SystemSetting` 中增加 `enableReplay: boolean`（預設為 `true`），前端提供開關控制。若關閉則全流程直接走標準 LLM 推導。

## Risks / Trade-offs

- **[Risk] ID 偏移點錯按鈕，但沒有拋出異常**
  - *說明*：若 ID 偏移（例如多了一個元素，導致 ID 15 從「登入」按鈕變成了「忘記密碼」按鈕），重放點擊了「忘記密碼」，且此點擊無特定文字等待，沒有拋錯。
  - *Mitigation*：當推進到下一個步驟時，由於畫面已偏離，下一步操作在當前頁面必然在 2000ms 內超時，重放會在該步驟中斷並觸發 Fallback 切回 LLM 重新觀察修復。
