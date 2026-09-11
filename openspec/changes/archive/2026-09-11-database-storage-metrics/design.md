## Context

目前 Autape 系統將所有測試步驟截圖（PNG base64 轉為 Buffer）儲存於 PostgreSQL 的 `test_run_step.screenshotData` 以及 `test_run.screenshotFailData` 之 `bytea` 欄位中。PostgreSQL 針對超過閾值的大型二進位欄位會自動啟動 TOAST 機制進行外表存儲。

在規劃中的 `screenshot-retention` 提案中，系統將會定時將過期截圖更新為 `NULL`。為了讓使用者能直觀了解目前資料庫的容量現況，並在清理截圖時能觀察到實質的容量變化，需要在前端設定面板中提供多維度空間監控。

## Goals / Non-Goals

**Goals:**
- 提供輕量、高效的後端儲存統計 API (`GET /api/settings/storage`)。
- 整合實體磁碟分配（`pg_database_size`）與截圖邏輯資料量（`octet_length`），精確呈現截圖佔比。
- 統計各主要資料表（`test_run_step`、`test_log`、`test_run`、`testcase` 等）的實體佔用排行。
- 於前端 `SettingsView.tsx` 提供設計風格一致的 Bento 儲存空間監控卡片，含空間分佈視覺條與手動重新整理按鈕。

**Non-Goals:**
- 不在此變更中實作定時過期清理 Worker（此部分專屬於 `screenshot-retention`）。
- 不主動調用 `VACUUM` 或 `VACUUM FULL` 等破壞性鎖表操作。

## Decisions

### 1. 雙層空間指標架構：實體磁碟 vs 邏輯截圖資料
- **做法**：
  1. **實體磁碟層**：使用 `pg_database_size(current_database())` 與 `pg_size_pretty`，反映 PostgreSQL 資料庫目錄在作業系統中所佔用的真實磁碟區塊。
  2. **邏輯截圖層**：使用 `SELECT COALESCE(SUM(octet_length("screenshotData")), 0) AS bytes, COUNT(*) AS count FROM "test_run_step" WHERE "screenshotData" IS NOT NULL`，加上 `test_run.screenshotFailData` 的統計。
- **Rationale**：在 PostgreSQL 的 MVCC 機制下，`UPDATE test_run_step SET screenshotData = NULL` 會產生 dead tuples，實體磁碟大小不會瞬間歸還給作業系統（需待日後重用或 autovacuum）。若只看 `pg_database_size`，使用者清理後會誤以為無效。提供邏輯截圖二進位體積，能讓截圖清理的成效立即以數字反饋。

### 2. 原生 SQL 聚合查詢服務 (`storageService.ts`)
- **做法**：
  在 `backend/src/services/storageService.ts` 封裝 `getDatabaseStorageMetrics()` 函式，透過 `AppDataSource.query()` 執行原生 SQL。
  查詢包含：
  - 資料庫總大小
  - 步驟截圖與失敗截圖二進位總大小與張數（合併統計）
  - 各表總大小排行（使用 `pg_total_relation_size`，涵蓋表格資料、TOAST 與索引）
- **格式轉換**：由後端或前端通用輔助函式統一格式化為 `B` / `KB` / `MB` / `GB`，同時保留精確 bytes 以利計算百分比。

### 3. 前端 Bento 儲存空間監控卡片 (`SettingsView.tsx`)
- **做法**：
  在 `SettingsView.tsx` 的「AI 模型配置」與「危險區域」之間，插入獨立的「儲存空間與清理」Bento 卡片。
  卡片佈局採左右兩欄分割或網格預留：
  - **左側/主體（本案實作）**：資料庫總大小、截圖佔用體積與總張數（合併步驟截圖與失敗畫面），並配備 Indigo (截圖資料) vs Zinc (其他中繼資料) 的雙色對比長條圖。
  - **右側（預留擴充）**：右上角配置「重新整理」按鈕（帶旋轉動畫與防抖），並預留版面空間給後續 `screenshot-retention` 提案的「截圖保留天數」輸入框與手動清理動作。
  - **零值防禦**：無截圖時穩定顯示 `0 B (0 張截圖)`，進度條顯示 `0%` 灰色基底並附提示「目前無任何截圖佔用空間」，避免版面跳動。

## Risks / Trade-offs

- **[Risk] 全表掃描計算 `octet_length` 在超巨量數據下可能延遲**
  - *說明*：若資料庫累積數十萬張截圖，`SUM(octet_length)` 可能耗費數百毫秒。
  - *Mitigation*：單機與小型團隊 E2E 測試系統的步驟截圖通常在數百至數千張規模，此查詢在 PostgreSQL 中通常僅需 10~30ms；此外此 API 僅在進入設定頁或使用者點擊重新整理時按需觸發，不影響排程與佇列執行。
