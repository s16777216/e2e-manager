## 1. 套件識別名稱

- [x] 1.1 將 root `package.json` 的 `"name": "e2e-manager-monorepo"` 改為 `"name": "autape-monorepo"`，並以 `Get-Content package.json` 確認 name 欄位已更新
- [x] 1.2 將 backend `package.json` 的 `"name": "e2e-manager-ts"` 改為 `"name": "autape-backend"`，並以 `Get-Content backend/package.json` 確認 name 欄位已更新
- [x] 1.3 於專案根目錄執行 `npm install` 重新產生 `package-lock.json`，並以 `git diff package-lock.json` 確認僅 name 欄位變動（`e2e-manager-monorepo`→`autape-monorepo`、`e2e-manager-ts`→`autape-backend`）、無意外相依版本升級

## 2. Docker 容器識別

- [x] 2.1 更新 `docker-compose.yml` 中三個 `container_name`：`e2e-manager-db`→`autape-db`、`e2e-manager-backend`→`autape-backend`、`e2e-manager-frontend`→`autape-frontend`，並以 `Get-Content docker-compose.yml` 確認不再出現 `e2e-manager-` 前綴容器名稱

## 3. 前端顯示名稱

- [x] 3.1 將 `frontend/index.html` 的 `<title>E2E Manager</title>` 改為 `<title>Autape</title>`，並確認 `frontend/index.html` 的 title 標籤已更新
- [x] 3.2 更新 `frontend/src/layouts/SidebarHeader.tsx`：將 `alt="E2E Manager"` 改為 `alt="Autape"`，顯示文字 `E2E Manager` 改為 `Autape`，並以 `lsp_diagnostics` 確認該檔無錯誤

## 4. 後端日誌品牌前綴

- [x] 4.1 更新 `backend/src/graph.ts` 中 4 處日誌前綴 `[E2E Manager]` 為 `[Autape]`（行 330、447、470、520），並以 `lsp_diagnostics` 確認該檔無錯誤、以 grep 確認 `[E2E Manager]` 不再出現於該檔

## 5. 文件品牌名稱

- [x] 5.1 更新 `README.md` 標題 `# Auto Step-by-Step E2E Test Manager` 為 `# Autape`，並確認 README.md 標題已更新、內文品牌稱呼一致
- [x] 5.2 更新 `AGENTS.md` 開頭敘述「E2E Manager TypeScript 專案」為「Autape TypeScript 專案」，並確認 AGENTS.md 不再出現舊品牌稱呼

## 6. 驗證

- [x] 6.1 執行 `npm run build` 確認建置成功（exit code 0），後端與前端皆可正常編譯
- [x] 6.2 執行 `npm test`（或 `npm run test`）確認既有測試全數通過，命名變更未破壞任何行為
- [x] 6.3 以 grep 於「現役（非 archive）」檔案範圍確認：品牌名稱 `E2E Manager`、`Auto Step-by-Step E2E Test Manager`，套件名稱 `e2e-manager-monorepo`/`e2e-manager-ts`，容器名稱 `e2e-manager-db/backend/frontend` 皆已替換；同時確認 `data-e2e-agent-id`、archive 目錄、其他變更提案中的路徑參照未受影響