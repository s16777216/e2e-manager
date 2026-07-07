## ADDED Requirements

### Requirement: TS Step Screenshot and Value Perception
系統 MUST 在每個測試步驟被判定執行完成時，自動捕捉當前瀏覽器的畫面截圖，並且在產生的簡化 DOM 中整合互動元素的 `value` 屬性，使得 Gemini LLM 能夠感知文字輸入框（包含隱碼密碼框）的當前狀態。

#### Scenario: Save TS screenshot after step
- **WHEN** 步驟 $n$ 被判定完成且 DOM 屬性包含對應 value 值
- **THEN** 系統於報告目錄儲存 `step_n_result.png` 截圖檔案並將 value 渲染於 DOM tag 中

### Requirement: TS Markdown Report and Fail Screenshot
測試案例結束後，系統 MUST 產生一份 Markdown 格式的測試報告，內容包含步驟歷程與截圖連結。若測試中途重試超限或出錯中斷，系統 MUST 自動擷取最後的失敗畫面存檔為 `screenshot_fail.png` 並嵌入報告中。

#### Scenario: Generate TS final report with failure screenshot
- **WHEN** 測試中途因重試超次中斷
- **THEN** 系統於報告目錄儲存 `screenshot_fail.png` 並在 `report.md` 中呈現最終失敗畫面與理由

### Requirement: Client Localized Timezone Adaptation
系統中所有顯示時間的欄位（如專案建立時間、批次任務啟動/完成時間、執行歷史啟動時間等），在前端呈現時，MUST 依據使用者當前的 Client 端瀏覽器/作業系統時區進行本地化顯示。後端 API 傳輸的時間資料，MUST 採用統一以 UTC 為基準的 ISO 8601 時間字串格式（即尾碼帶 `Z`）。

#### Scenario: Display date with user timezone offset
- **WHEN** 前端自後端 API 接收到 ISO 格式之 UTC 時間字串（如 "2026-07-07T03:00:00.000Z"）時
- **THEN** 前端頁面 MUST 將其轉換為使用者當前的 Client 端本地時區時間並顯示（例如台北時間顯示為 2026-07-07 11:00:00）
