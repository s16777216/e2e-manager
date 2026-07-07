## ADDED Requirements

### Requirement: Same-Origin Nginx Reverse Proxy
系統 MUST 提供 Nginx 代理伺服器作為唯一的對外網路進入點，對外僅暴露單一連接埠（3001）。Nginx MUST 將所有的 API 請求與 SSE (Server-Sent Events) 進度監聽串流請求（`/api/runs/*/stream`）無縫轉發給後端服務容器。

#### Scenario: Running frontend and backend under Nginx
- **WHEN** 使用者造訪 `http://<host>:3001`，且前端向相對路徑 `/api/...` 發送請求
- **THEN** Nginx 正確處理分流：普通資源載入由 Nginx 託管的靜態網頁直接響應，API 請求則隱密地反向代理給後端容器，且不觸發任何 CORS 跨域安全限制

### Requirement: Real-time SSE Streaming without Buffering
Nginx 代理伺服器在轉發 SSE 串流服務時，MUST 關閉回應快取緩衝機制（Buffering），以確保後端 Worker 發送的步驟日誌與截圖能以「即時流式（Streaming）」傳輸至前端。

#### Scenario: SSE progress updates immediately
- **WHEN** 測試正在執行，後端 Worker 透過 SSE 連線寫入步驟日誌
- **THEN** 前端儀表板 MUST 即時（延遲 < 500ms）收到並渲染出步驟與截圖進度，不受 Nginx 緩衝快取延遲影響

### Requirement: Database Persistence and Wait-for-Ready
系統 MUST 提供 PostgreSQL 15 容器持久化機制，且後端 API 容器在啟動時 MUST 與資料庫進行連線就緒檢查。

#### Scenario: Database restart does not lose data
- **WHEN** 資料庫容器重啟或重建
- **THEN** 系統歷史數據與截圖資料完整保留，且後端服務啟動時會等待資料庫就緒後才正式開啟 API 服務

### Requirement: Frontend UI library structure
前端專案 MUST 具備正確的 shadcn/ui 元件安裝配置，當使用 CLI 新增元件時，相關檔案 MUST 被正確寫入至專案的 `src/components/ui/` 目錄下。

#### Scenario: Verify component output path
- **WHEN** 執行 `npx shadcn add` 時
- **THEN** 元件檔案會被放置在 `frontend/src/components/ui/` 資料夾下，且不會產生額外的 `frontend/@` 資料夾

### Requirement: TypeScript Unit Testing Environment
系統 MUST 提供支援原生 ESM 與 TypeScript 的單元測試執行環境。測試執行器 SHALL 原生支援 TS 檔案導入與執行，無需繁瑣的編譯設定，且 SHALL 提供單次運行（run）模式與開發時的監聽（watch）模式。

#### Scenario: Single test execution via CLI
- **WHEN** 開發者執行 `npm run test` 啟動測試命令
- **THEN** 系統以單次運行模式啟動單元測試，執行所有檢測到的測試檔案，輸出成功/失敗統計並安全退出

#### Scenario: Watch mode for active development
- **WHEN** 開發者執行 `npm run test:watch` 啟動測試命令
- **THEN** 系統以監聽模式啟動，保持進程常駐，並在偵測到原始碼或測試檔修改時，自動重新運行相關測試

### Requirement: Mock and Stub support for Isolation
測試環境 SHALL 提供 Mock 與 Stub 的功能，以便在不發起真實 PostgreSQL 資料庫連線或不開啟 Playwright 瀏覽器的前提下，對包含外部相依性的核心業務邏輯進行徹底的邏輯隔離測試。

#### Scenario: Mock database repository query
- **WHEN** 單元測試執行防環邏輯時，傳入被 Stub 化的 groupRepo，並調用 `findOne`
- **THEN** 系統不發起真實 SQL 連線，而是直接藉由 Stub 函數回傳模擬的群組節點資料，防環計算得出預期結果
