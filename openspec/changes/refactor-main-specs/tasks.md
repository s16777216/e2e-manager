## 1. 規格重組準備

- [ ] 1.1 執行 `/opsx-sync` 將新設計的 Delta Specs 同步並建立至 `openspec/specs/`
- [ ] 1.2 核對並確認即將被刪除的 30 個舊規格資料夾清單

## 2. 舊規格清理

- [ ] 2.1 刪除 `openspec/specs/` 目錄下被整併的 30 個舊有規格資料夾
- [ ] 2.2 確保保留且正確更新的 7 個主規格資料夾結構完整（`e2e-runner`、`task-queue`、`testcase-management`、`reporting-and-assertion`、`web-dashboard`、`system-settings`、`infrastructure`）

## 3. 規格校驗與完成

- [ ] 3.1 檢查並修復所有合併後規格檔案中 Purpose 與 4 級標題 `#### Scenario:` 情境格式，確保沒有 Silent Fail
- [ ] 3.2 執行 `openspec status` 確保重構變更項目無錯誤並正常封存
