## MODIFIED Requirements

### Requirement: TS Step Screenshot and Value Perception
系統 MUST 在每個測試步驟被判定執行完成時，透過 Stagehand 的 Playwright 實例自動捕捉當前瀏覽器的畫面截圖，並儲存至報告目錄以利前端 Timeline 顯示。

#### Scenario: Save TS screenshot after step
- **WHEN** 步驟 $n$ 被 Stagehand 執行完成
- **THEN** 系統於報告目錄儲存 `step_n_result.png` 截圖檔案

### Requirement: TS Visual Expected Result Assertion
系統 MUST 在每個步驟（或最終步驟）執行完畢後，呼叫 Stagehand 的 `page.observe()` 方法，將預期結果（Expected Outcome）描述作為參數傳入，由 Stagehand 的 AI 觀察器判定當前網頁狀態是否符合預期，並回傳結構化的判定結果與理由。

#### Scenario: Final TS assertion pass
- **WHEN** 網頁最終狀態符合 Expected 描述，且 `page.observe()` 回傳成功判定
- **THEN** 系統判定該測試案例結果為 PASS
