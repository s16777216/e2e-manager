## Context

隨著 E2E 測試在 Web 與 AI 流程中頻繁執行，步驟截圖（bytea）會迅速佔滿 PostgreSQL 的儲存空間。為了避免資料庫爆滿，同時保留有價值的測試歷史趨勢數據，我們需要實作自動清理過期截圖的機制，並以明確的狀態欄位防止前端顯示破圖。

## Goals / Non-Goals

**Goals:**

- 在 `SystemSetting` 中加入 `screenshotRetentionDays` 保留天數設定，預設 30 天，0 表示永久保留。
- 在 `TestRun` 與 `TestRunStep` 中新增狀態標記欄位，明確區分無截圖、可用、已過期三種狀態。
- 實作定時自動清理過期截圖二進位數據的後端服務，整合至 `TaskQueue` 背景 Worker，**每日執行一次**。
- 修改前端 `SettingsView`，整合截圖保留天數設定輸入。
- 修改前端步驟與執行詳情頁面，以時鐘圖示和說明友善展示已過期的步驟與失敗截圖，**提示中包含保留天數**，避免破圖。

**Non-Goals:**`

- 本案不包含對實體硬碟報告（`backend/reports/`）的清理。
- 本案不包含在 CLI 模式下進行歷史截圖清理。

## Decisions

### 1. 新增明確的 `screenshotStatus` / `screenshotFailStatus` 狀態欄位

- **決策說明**：於 `TestRunStep` 新增 `screenshotStatus`（`none` | `available` | `expired`，預設 `none`），於 `TestRun` 新增 `screenshotFailStatus`（同上）。
- **理由**：
  - **避免 UX 破圖與混淆**：若僅將截圖二進位設為 `NULL`，前端無法區分「未擷取」與「已過期」，會造成使用者困惑。明確的狀態能讓前端精準展示不同的提示占位符。
  - **未來相容性**：若未來新增「手動關閉特定步驟截圖」的功能，狀態機設計能完美相容。
- **替代方案**：使用時間戳與執行結果在前端動態推導。但這容易因為前端時區或將來的截圖開關邏輯而產生誤判，不夠健壯。

### 2. 自動清理服務：每日一次、分批處理、追蹤上次執行時間

- **決策說明**：
  - 在 `TaskQueue.startWorker` 的輪詢迴圈中，**每次迴圈檢查 `lastCleanupAt`**，距上次清理超過 24 小時才執行 `cleanExpiredScreenshots()`。
  - 清理服務使用 **分批 UPDATE**（每批 `LIMIT 500`），搭配 `WHERE screenshotData IS NOT NULL`，避免大交易鎖表。
  - 以 `TestRun.createdAt` / `TestRunStep.createdAt` 為過期判斷基準（`NOW() - INTERVAL 'N days'`）。
- **理由**：
  - **零外部依賴**：不需引入 Cron Job 模組，使用現有背景輪詢機制即可。
  - **不阻塞主流程**：分批清理，每批極快，不影響正常測試佇列執行。
  - **可觀測性**：記錄 `lastCleanupAt` 便於除錯與監控。

### 3. 既有資料懶惰遷移（Lazy Migration）

- **決策說明**：不寫一次性 Migration Script。在 API 層（`run.ts` 回傳、`graph.ts` 寫入）處理：
  - 讀取時：若 `screenshotData IS NOT NULL` 但 `screenshotStatus = 'none'` → 視為 `available` 回傳。
  - 寫入時：`graph.ts` 存截圖成功時，同步設 `screenshotStatus = 'available'`。
- **理由**：
  - 避免大表鎖定風險。
  - 自然地隨使用逐步修正，無停機需求。

### 4. 前端 Bento 排版整合與狀態展現

- **決策說明**：
  - `SettingsView.tsx`：「危險區域」擴充為「儲存空間與清理」卡片，新增「截圖保留天數」數字輸入（0 = 永久保留）。
  - `StepAccordion.tsx` / `SSEConsoleView.tsx`：`expired` 狀態渲染灰色時鐘圖示 + 文字「此步驟之截圖已過期清理 (保留 N 天)」，不發送圖片請求。
  - Tooltip / hover 顯示完整保留政策說明。
- **理由**：維持 Bento 設計系統精緻感，讓過期清理體驗自然且資訊完整。

## Risks / Trade-offs

- **[風險]**: 在執行自動清理時，過大的 UPDATE 查詢可能會造成資料庫短暫鎖死。
  - **[對策]**: 加入 `WHERE screenshotData IS NOT NULL` 條件，**並限制每批 `LIMIT 500`**，僅對仍持有截圖資料的列進行更新，減少掃描與鎖定的行數。

- **[風險]**: Worker 重啟導致 `lastCleanupAt` 遺失，可能造成一天內重複清理。
  - **[對策]**: `lastCleanupAt` 寫入 `SystemSetting` 或專用 metadata 表持久化（本案暫存在記憶體，重啟後最多提前一天清理一次，影響極小，可接受）。

- **[權衡]**: 使用 `createdAt` 而非 `finishedAt` 判斷過期。
  - **理由**: 實作簡單、符合提案說明；極少數長時間運行測試（超過保留天數）會在跑完前被清理，但此情境極罕見（E2E 測試通常分鐘級完成）。
