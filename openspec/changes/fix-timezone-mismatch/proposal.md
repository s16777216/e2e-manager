## Why

目前系統中前端顯示的所有時間欄位（例如：專案建立時間、任務啟動時間與結束時間等）皆顯示為 UTC 時間（相較於使用者的本地台北時間慢了 8 小時），這會導致使用者在使用上產生時間認知的困惑，難以核對測試執行歷史與真實發生的時間點。

## What Changes

* **修正後端讀寫時區一致性**：確保後端服務自資料庫讀取時間資料時，能將不帶時區的 timestamp 正確轉換成 UTC，進而在 JSON 序列化傳送至前端時帶有正確的 UTC 標記（Z）。
* **保持前端本地化顯示**：前端繼續保留以 `toLocaleString()` 轉換為 Client 瀏覽器本地時區的顯示邏輯，從而校正回使用者端正確的本地時間。

## Capabilities

### New Capabilities
- timezone-alignment: 系統全域時間欄位之本地時區自適應顯示與統一 UTC 傳輸

### Modified Capabilities

## Impact

* **後端資料庫配置與連線**：調整 TypeORM 的 Entity 欄位定義或是資料庫連線驅動的 parser 設定。
* **API 資料格式**：API 回傳的 ISO 時間字串將修正為對應正確時間點的 UTC 字串。
