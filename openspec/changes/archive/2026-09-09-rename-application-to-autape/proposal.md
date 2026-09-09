## Why

目前的產品名稱「Auto Step-by-Step E2E Test Manager」過於冗長且不易記憶，無法作為對外公開的產品品牌。使用者希望採用一個與「猴子 (Ape)」與「自動化 (Auto)」相關、活潑俏皮且易於識別的英文公開產品名稱，最終選定 **Autape**（Auto + Ape 的自創組合字）。重新命名可強化品牌識別、方便記憶與對外宣傳。

## What Changes

- **BREAKING** 將公開品牌名稱由「E2E Manager / Auto Step-by-Step E2E Test Manager」全面更名為 **Autape**。
- **BREAKING** root `package.json` 的 `name` 由 `e2e-manager-monorepo` 改為 `autape-monorepo`。
- **BREAKING** backend `package.json` 的 `name` 由 `e2e-manager-ts` 改為 `autape-backend`。
- **BREAKING** `docker-compose.yml` 的 `container_name`（`e2e-manager-db` / `e2e-manager-backend` / `e2e-manager-frontend`）改為 `autape-db` / `autape-backend` / `autape-frontend`。
- 更新前端使用者可見名稱：`frontend/index.html` 的 `<title>`、`frontend/src/layouts/SidebarHeader.tsx` 的顯示文字與 `alt`。
- 更新 `README.md`、`AGENTS.md`、`openspec/VERIFY.md` 及其他現役檔案中的舊名稱稱呼。
- 更新 backend `src/graph.ts` 中出現的舊品牌名稱。
- 保留程式碼中的內部專有名詞（如 `data-e2e-agent-id`、`TestRun`、`TestLog` 等測試領域概念），僅替換品牌/套件識別名稱，避免改動實際行為。
- 不修改 `openspec/changes/archive/` 下已歸檔的歷史變更記錄（依 AGENTS.md 反模式規範）。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

無（本變更為純品牌與識別名稱更動，不改變任何應用程式行為、API、資料結構或使用者功能，故不產生 spec 級要求變更，`skip_specs: true`）。

## Impact

- **套件識別**：root 與 backend 的 `package.json` `name` 欄位更動；`package-lock.json` 會隨之重新產生。`frontend/package.json` 維持 `frontend` 不變（其為 monorepo 內部工作區名稱）。
- **部署**：`docker-compose.yml` 的 `container_name` 更動，需重新建立容器 (`docker compose up -d --build`)；若有以舊容器名稱相依的腳本或外部連結需一併更新。
- **使用者介面**：瀏覽器標題、側邊欄品牌名稱與標誌 `alt` 文字更新。
- **文件**：README、AGENTS.md、VERIFY.md 及相關開發文件中的品牌名稱全面替換。
- **不影響**：資料庫結構、API 端點、SSE、LLM 模型管理、測試執行邏輯等行為皆不變。
