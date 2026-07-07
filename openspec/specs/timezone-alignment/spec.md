# timezone-alignment Specification

## Purpose
全域時間欄位之本地時區自適應顯示與統一 UTC 傳輸規格定義。

## Requirements

### Requirement: Client Localized Timezone Adaptation
系統中所有顯示時間的欄位（如專案建立時間、批次任務啟動/完成時間、執行歷史啟動時間等），在前端呈現時，MUST 依據使用者當前的 Client 端瀏覽器/作業系統時區進行本地化顯示。後端 API 傳輸的時間資料，MUST 採用統一以 UTC 為基準的 ISO 8601 時間字串格式（即尾碼帶 `Z`）。

#### Scenario: Display date with user timezone offset
- **WHEN** 前端自後端 API 接收到 ISO 格式之 UTC 時間字串（如 "2026-07-07T03:00:00.000Z"）時
- **THEN** 前端頁面 MUST 將其轉換為使用者當前的 Client 端本地時區時間並顯示（例如台北時間顯示為 2026-07-07 11:00:00）
