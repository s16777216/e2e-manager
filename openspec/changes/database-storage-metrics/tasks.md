## 1. 後端儲存指標服務與 API 實作 (Backend Storage Metrics Service & API)

- [ ] 1.1 建立 `backend/src/services/storageService.ts`，實作 `getDatabaseStorageMetrics()`：
  - 透過原生 SQL 查詢目前資料庫整體實體佔用大小（`pg_database_size`）。
  - 透過 `octet_length` 統計 `test_run_step` 與 `test_run` 中的截圖二進位二級實際佔用位元組總數與張數（合併步驟截圖與失敗畫面）。
  - 查詢主要資料表（`test_run_step`、`test_log`、`test_run`、`testcase`）實體大小排行（`pg_total_relation_size`）。
  - 實作位元組大小格式化函式（Bytes 轉為 KB / MB / GB）。
- [ ] 1.2 在 `backend/src/routes/settings.ts` 中新增 `GET /api/settings/storage` 端點，對接 `storageService` 並回傳結構化統計指標。
- [ ] 1.3 撰寫後端單元測試 `backend/tests/storage.test.ts`，驗證儲存指標計算、格式化函式與資料結構正確性。

## 2. 前端型別與儲存空間 Bento 卡片實作 (Frontend Storage Bento UI)

- [ ] 2.1 修改 `frontend/src/types/api.ts`，新增 `DatabaseStorageMetrics` 等相關型別定義。
- [ ] 2.2 在 `frontend/src/views/SettingsView.tsx` 中新增「儲存空間與資料庫狀態」Bento 監控卡片：
  - 顯示資料庫總體積、截圖合併佔用體積、有效截圖張數與百分比。
  - 繪製 Indigo (截圖佔用) vs Zinc (其他結構) 的雙色空間分佈視覺進度條。
  - 卡片右側配置「重新整理」按鈕（帶旋轉動畫與防抖），並預留後續 retention 控制元件之排版佈局。
- [ ] 2.3 確保在資料庫剛初始化或無截圖狀態時能優雅顯示（0 B / 0 張），防範空值與除以零錯誤，並給予提示文字。

## 3. 打包編譯與整合驗證 (Build & Verification)

- [ ] 3.1 執行前後端建置編譯（`npm run build`），確保 TypeScript 與 Vite 打包無型別與語法錯誤。
- [ ] 3.2 執行後端單元測試（`npm test`），確保現有測試與新增之儲存測試全數通過。
- [ ] 3.3 啟動或調用 API 驗證 `GET /api/settings/storage` 能精確計算當前 PostgreSQL 實體容量與截圖數量。
