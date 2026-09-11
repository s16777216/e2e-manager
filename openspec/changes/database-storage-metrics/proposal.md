## Why

目前 Autape 系統將所有 E2E 測試步驟截圖以二進位（bytea）儲存於 PostgreSQL 中。隨著測試任務頻繁執行，資料庫容量會迅速膨脹，但目前使用者在主控台與設定面板上完全無法感知當前 PostgreSQL 使用了多少磁碟空間、以及截圖資料在其中所佔的比例。

為了解決儲存容量黑盒問題，並為後續即將實作的「截圖過期清理（screenshot-retention）」提供精確的觀察基準線與清理前後對照，我們需要引入資料庫儲存空間指標（Database Storage Metrics）機制，提供多維度的空間查詢 API 與前端視覺化儀表板。

## What Changes

- **後端儲存指標查詢服務與 API**：
  - 新增 `GET /api/settings/storage` API 路由，透過 TypeORM / PostgreSQL 系統函式查詢：
    - `databaseSize`：資料庫整體實體磁碟佔用（`pg_database_size` 與 `pg_size_pretty`）。
    - `screenshots`：目前實際儲存的步驟截圖總二進位大小（`SUM(octet_length("screenshotData"))`）與有效截圖總張數。
    - `tables`：主要資料表（`test_run_step`、`test_log`、`test_run`、`testcase` 等）實體大小排序（`pg_total_relation_size`）。
- **前端儲存空間視覺化 Bento 卡片**：
  - 於 `frontend/src/views/SettingsView.tsx` 新增「儲存空間監控」Bento 卡片。
  - 提供儲存分佈進度條（截圖佔用 vs 索引與日誌資料），並以圖表/標籤顯示總容量、截圖體積與截圖總張數。
  - 提供「重新整理」按鈕，方便隨時獲取最新的資料庫水位。

## Capabilities

### New Capabilities
<!-- 無新增獨立 capability，此項擴充既有 system-settings 範疇 -->

### Modified Capabilities
- `system-settings`: 擴充系統設定能力，新增 PostgreSQL 資料庫儲存空間多維度統計 API 與前端視覺化監控面板。

## Impact

- **後端模組**：
  - `backend/src/services/storageService.ts`（新增儲存空間查詢服務）
  - `backend/src/routes/settings.ts`（新增 `GET /api/settings/storage` 路由）
- **前端視圖與型別**：
  - `frontend/src/types/api.ts`（新增 `StorageMetrics` 等型別定義）
  - `frontend/src/views/SettingsView.tsx`（新增儲存空間 Bento 監控區塊）
