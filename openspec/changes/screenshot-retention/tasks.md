## 0. 既有資料懶惰遷移（無需 Migration Script）

- [ ] 0.1 修改 `backend/src/routes/run.ts` GET /api/runs/:id：回傳步驟時，若 `screenshotData IS NOT NULL` 但 `screenshotStatus = 'none'` → 回傳 `screenshotStatus: 'available'`。
- [ ] 0.2 修改 `backend/src/graph.ts` stepTrackerNode / reporterNode：寫入截圖成功時，同步設 `screenshotStatus = 'available'` / `screenshotFailStatus = 'available'`。

## 1. 後端資料表與設定欄位擴充

- [ ] 1.1 修改 `backend/src/entities/SystemSetting.ts`，新增 `screenshotRetentionDays` 欄位（`integer`，預設為 0 = 永久保留）。
- [ ] 1.2 修改 `backend/src/entities/TestRunStep.ts`，新增 `screenshotStatus` 欄位（`varchar`，預設為 `none`，可選值：`none` | `available` | `expired`）。
- [ ] 1.3 修改 `backend/src/entities/TestRun.ts`，新增 `screenshotFailStatus` 欄位（同上）。
- [ ] 1.4 執行 TypeORM migration 產生並套用資料庫結構變更。

## 2. 後端清理服務與執行狀態標記實作

- [ ] 2.1 建立 `backend/src/services/cleanerService.ts`，實作 `cleanExpiredScreenshots()`：
    - 讀取 `SystemSetting.screenshotRetentionDays`（0 時直接返回 0）。
    - 計算截止日：`createdAt < NOW() - INTERVAL 'N days'`。
    - **分批處理**：每批 `LIMIT 500`，搭配 `WHERE screenshotData IS NOT NULL` / `screenshotFailData IS NOT NULL`。
    - 更新：`screenshotData = NULL, screenshotStatus = 'expired'`（步驟）；`screenshotFailData = NULL, screenshotFailStatus = 'expired'`（任務失敗截圖）。
    - 回傳清理筆數供日誌記錄。
- [ ] 2.2 修改 `backend/src/queue.ts` `TaskQueue` 類別：
    - 新增私有屬性 `lastCleanupAt: Date | null = null`。
    - 在 `startWorker` 輪詢迴圈中：檢查 `!lastCleanupAt || Date.now() - lastCleanupAt.getTime() > 24*60*60*1000` 才呼叫 `cleanExpiredScreenshots()`，完成後更新 `lastCleanupAt = new Date()`。
    - 清理錯誤不中斷主流程（try-catch 包裹並記錄錯誤）。
- [ ] 2.3 修改 `backend/src/graph.ts`：
    - `stepTrackerNode`：步驟截圖寫入成功後，設 `stepRunEntity.screenshotStatus = 'available'`。
    - `reporterNode`：失敗截圖寫入成功後，設 `run.screenshotFailStatus = 'available'`。
- [ ] 2.4 修改 `backend/src/routes/run.ts` GET /api/runs/:id：回傳 JSON 中包含 `screenshotFailStatus` 及各步驟的 `screenshotStatus`（套

## 3. 前端 Bento 設定面板與步驟截圖狀態渲染

- [ ] 3.1 修改 `frontend/src/types/api.ts`：
    - `SystemSettings` 新增 `screenshotRetentionDays: number`。
    - `TestRun` 新增 `screenshotFailStatus: 'none' | 'available' | 'expired'`。
    - `TestRunStep` 新增 `screenshotStatus: 'none' | 'available' | 'expired'`。
- [ ] 3.2 修改 `frontend/src/views/SettingsView.tsx`：
    - 在「儲存空間與清理」卡片中，新增「截圖保留天數」數字輸入框（min=0，0 代表永久保留）。
    - 表單驗證：非負整數。
    - 對接 `POST /api/settings` 儲存。
- [ ] 3.3 修改 `frontend/src/components/custom/StepAccordion.tsx`：
    - 讀取 `step.screenshotStatus`。
    - `expired` 時：渲染灰色時鐘圖示 + 文字「此步驟之截圖已過期清理 (保留 N 天)」（N 來自設定或預設值），**不發送圖片請求**。
    - `none` 時：不顯示截圖區塊（維持現狀）。
    - `available` 時：正常顯示截圖（維持現狀）。
- [ ] 3.4 修改 `frontend/src/views/SSEConsoleView.tsx`：
    - 讀取 `runStatus.screenshotFailStatus`。
    - 同 3.3 邏輯處理失敗截圖顯示。

## 4. 編譯與 E2E 整合測試

- [ ] 4.1 執行 `npm run build`，確保前端與後端專案皆能正常通過 TypeScript 編譯，且 Vite 能無誤打包。
- [ ] 4.2 啟動服務並切換至設定頁面，將「截圖保留天數」設為 1 天，執行一筆測試，驗證剛跑完時截圖能正常顯示（`available`）。
- [ ] 4.3 於資料庫中將剛才產出的 TestRun 及 TestRunStep 的 `createdAt` 手動前調 2 天，重啟 Worker 觸發清理，驗證：
    - 截圖二進位欄位已設為 NULL。
    - 狀態欄位為 `expired`。
    - 前端 StepAccordion 與 SSEConsole 均正確顯示「此步驟之截圖已過期清理 (保留 1 天)」，未發生破圖。
- [ ] 4.4 驗證設定「截圖保留天數 = 0」時，不執行清理，截圖永久保留。
- [ ] 4.5 驗證 Worker 重啟後，`lastCleanupAt` 重置不影響功能（最多提前一天清理一次）。