## Why

目前 `SystemSetting.aiConfig` 將 AI 模型連線資訊（供應商、API 金鑰、Base URL、模型名稱）與角色分配（誰是執行器、誰是報告器）混在同一個 JSONB 欄位中，導致每新增一個 AI 角色就必須複製一份完整的連線參數，且無法跨角色共用同一個模型連線設定。

## What Changes

- **新增** `model_setting` 資料表與對應 API，讓使用者可獨立管理 LLM 連線設定（名稱、供應商、金鑰、Base URL、模型名稱）
- **新增** 模型管理 UI 頁面（`/models`），支援 CRUD 操作；刪除時若模型正在被引用則拒絕並提示
- **修改** `SystemSetting.aiConfig` 結構：改為以 `ModelId` 引用方式指定各角色使用的模型（`executorModelId`、`reportModelId`），移除舊有的直接連線參數
- **移動** `sendFailureScreenshot` 欄位從 `aiConfig` 至 `SystemSetting` 頂層
- **修改** 系統設定 UI，AI 角色配置改為下拉選單選擇已建立的 ModelSetting
- 執行測試時，若 `executorModelId` 未設定或對應的 ModelSetting 不存在，**拒絕執行**並提示使用者
- 舊有 `aiConfig` 資料（含直接連線參數）在升級後直接廢棄，**使用者須手動重新設定** **BREAKING**

## Capabilities

### New Capabilities

- `model-management`：獨立的 LLM 連線設定管理，支援新增/編輯/刪除模型設定，每個設定包含名稱、供應商、API 金鑰、Base URL、模型名稱；提供 REST API 與 UI 頁面

### Modified Capabilities

- `system-settings`：`aiConfig` 結構從直接儲存連線參數改為以 ModelId 引用方式設定各 AI 角色；`sendFailureScreenshot` 移至頂層；執行測試前加入 ModelSetting 存在性驗證

## Impact

- **DB Schema**：新增 `model_setting` table，`system_setting.aiConfig` JSONB 結構破壞性變更
- **Backend**：新增 `ModelSetting` entity、`modelService.ts`、`/api/models` 路由；修改 `llmFactory.ts`（改從 ModelSetting 建立 LLM 實例）、`settingsService.ts`、`graph.ts`
- **Frontend**：新增 `ModelManageView.tsx`（`/models` 路由）；修改 `SettingsView.tsx`（AI 配置改為下拉選單）
- **Breaking Change**：舊有 `aiConfig` 格式失效，現有使用者須手動重新設定模型與角色分配
