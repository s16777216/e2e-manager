## Context

See proposal.md — Why。目前專案使用多種舊品牌/識別名稱：公開品牌「Auto Step-by-Step E2E Test Manager / E2E Manager」、root 套件 `e2e-manager-monorepo`、backend 套件 `e2e-manager-ts`、docker 容器 `e2e-manager-db/backend/frontend`。本次將全面更名為 **Autape**。

範圍界定（已與使用者確認）：
- **要改**：公開品牌顯示名稱、root/backend `package.json` name、`docker-compose.yml` container_name、後端日誌前綴、前端 `<title>` 與側邊欄品牌文字。
- **不改**：其他變更提案或已歸檔專案中的 `file:///c:/works/e2e-manager-ts/...` 路徑參照（屬檔案路徑，非品牌，改動會污染其他變更）。`docs/E2E_Platform_Experience_and_Improvement_Report.md` 內的「E2E Manager」稱呼與 `openspec/VERIFY.md` 標題維持現狀。
- **不動 archive**：`openspec/changes/archive/` 下所有歷史變更記錄（依 AGENTS.md 反模式規範）。
- **保留技術識別碼**：`data-e2e-agent-id` DOM 標籤、資料庫 entity（TestRun/TestLog 等）維持不變——這些是內部技術識別，與品牌無關，改動風險高。

## Goals / Non-Goals

**Goals:**
- 將所有「現役（非 archive）」檔案中的品牌名稱與套件/容器識別碼替換為 Autape。
- 維持應用程式行為完全不變（測試執行、API、SSE、資料結構）。

**Non-Goals:**
- 不改變任何技術識別碼（`data-e2e-agent-id`、TestRun/TestLog 等）。
- 不修改已歸檔變更（archive/）。
- 不修改其他活躍變更提案中的檔案路徑參照。
- 不修改 docs 報告與 VERIFY.md（維持使用者決定的範圍）。
- 不重新命名任何目錄或程式碼檔案本身。

## Decisions

**D1: 命名映射規則**

| 現況 | 目標 | 說明 |
|------|------|------|
| `Auto Step-by-Step E2E Test Manager` | `Autape` | README 標題、品牌名稱 |
| `E2E Manager` | `Autape` | 前端 `<title>`、側邊欄、後端日誌前綴 |
| `e2e-manager-monorepo` | `autape-monorepo` | root `package.json` name |
| `e2e-manager-ts` | `autape-backend` | backend `package.json` name |
| `e2e-manager-db` | `autape-db` | docker `container_name` |
| `e2e-manager-backend` | `autape-backend` | docker `container_name` |
| `e2e-manager-frontend` | `autape-frontend` | docker `container_name` |

理由：維持「monorepo / backend / db / frontend」的角色後綴，便於辨識服務用途；僅更換品牌前綴。取代數值不一致的 `$AUTAPE` 字串。

**D2: `package-lock.json` 處理**

root `package-lock.json` 內含 `e2e-manager-monorepo` 與 backend 工作區 `e2e-manager-ts` 參照。由於 backend 套件 name 改變，lockfile 需重新產生以保持一致性。

做法：修改 `package.json` 後，於 `backend/` 或 root 執行 `npm install` 重新產生 lockfile，而非手動編輯 lockfile 內容（避免手動編輯造成相依樹不一致）。

理由：lockfile 由 npm 管理，手動修改易造成 drift。

**D3: 後端日誌前綴**

`backend/src/graph.ts` 中 4 處 `console.error/log("[E2E Manager] ...")` 的日誌前綴改為 `[Autape] ...`。

理由：日誌前綴屬品牌識別，非行為邏輯。改動不影響任何測試斷言或業務流程（僅 console 輸出字串）。

**D4: 前端顯示名稱**

- `frontend/index.html` `<title>`：`E2E Manager` → `Autape`。
- `frontend/src/layouts/SidebarHeader.tsx`：`alt="E2E Manager"` 與顯示文字 `E2E Manager` → `Autape`。

理由：拜訪者可見的品牌文字，屬本次重新命名核心。僅改字串，不動元件結構與樣式。

## Risks / Trade-offs

- **[docker 容器名稱變更會影響既有部署] → Mitigation**：docker-compose 的 `container_name` 改變後，需 `docker compose down` 再 `up` 重建容器；若外部有以舊容器名稱 (`e2e-manager-backend` 等) 連結的腳本/監控，需一併更新。文件（README 部署段）同步更新。
- **[lockfile 重新產生可能引入版本漂移] → Mitigation**：僅在同一 `package.json` 版本約束下重新產生；執行 `npm install` 後以 `git diff package-lock.json` 檢查是否僅 name 欄位變動、無意外升級。
- **[全域替換可能誤改不該動的內容] → Mitigation**：不進行盲目的全域搜尋替換；改以逐檔、逐行的精確替換（僅針對上述列出之「現役」檔案與指定文字），並明確排除 archive、docs、VERIFY.md、路徑參照與技術識別碼。
- **[README 中文內容出現亂碼（終端顯示）] → Mitigation**：編輯時以工具直接讀寫 UTF-8，避免以 PowerShell console 輸出造成誤判；改動以 Read/Edit 工具精確處理。

## Migration Plan

1. 更新 root `package.json` name → `autape-monorepo`。
2. 更新 backend `package.json` name → `autape-backend`。
3. 重新產生 `package-lock.json`（`npm install`），檢查 diff 無意外版本變動。
4. 更新 `docker-compose.yml` 三個 `container_name`。
5. 更新 `frontend/index.html` `<title>` 與 `frontend/src/layouts/SidebarHeader.tsx` 品牌文字。
6. 更新 `backend/src/graph.ts` 4 處日誌前綴。
7. 更新 `README.md` 標題與品牌稱呼。
8. 更新 `AGENTS.md` 開頭介紹的「E2E Manager TypeScript 專案」稱呼。
9. 驗證：`npm run build`、`npm test`、`lsp_diagnostics` 乾淨。
10. 部署套用時：`docker compose down && docker compose up -d --build` 重建容器。

**Rollback**：本變更皆為純字串替換，無資料庫或行為變更；回復時將各檔案文字改回舊名稱即可，無遷移副作用。
