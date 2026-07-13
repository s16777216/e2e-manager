## Wave 1：後端資料層

- [x] 1.1 新增 `backend/src/entities/ModelSetting.ts` TypeORM Entity（欄位：`id` UUID PK、`name`、`description`、`provider`、`apiKey`、`baseUrl`、`model`、`createdAt`、`updatedAt`）
- [x] 1.2 修改 `backend/src/entities/SystemSetting.ts`：
  - 將 `aiConfig` JSONB 型別改為 `{ executorModelId?: string; reportModelId?: string; }`（移除舊有直接連線參數）
  - 頂層新增 `@Column("boolean", { default: true }) sendFailureScreenshot!: boolean`
- [x] 1.3 修改 `backend/src/db.ts`：將 `ModelSetting` 加入 `entities` 陣列，使 `synchronize: true` 自動建立 `model_setting` table

**驗收點**：啟動後端後 DB 出現 `model_setting` table，`system_setting` 有 `sendFailureScreenshot` 欄位。

---

## Wave 2：ModelSetting Service

- [x] 2.1 新增 `backend/src/services/modelService.ts`，實作：
  - `getAllModels()`
  - `createModel(dto)`
  - `updateModel(id, dto)`
  - `deleteModel(id)`：先查詢 `SystemSetting.aiConfig` 所有 `xxxModelId` 欄位是否含有該 ID，若有則拋出 409 並明確告知使用角色名稱（如「此模型正被「執行器」使用中」）
- [x] 2.2 修改 `backend/src/services/settingsService.ts`：
  - 更新 `AiConfig` interface：移除舊連線參數欄位，改為 `{ executorModelId?: string; reportModelId?: string; }`
  - 更新 `DEFAULT_AI_CONFIG` 對應
  - `sendFailureScreenshot` 改從 `SystemSetting` 頂層欄位讀取，不再放入 `aiConfig`

**驗收點**：可呼叫 `modelService.createModel()`，TypeScript 編譯無誤。

---

## Wave 3：API 路由

- [x] 3.1 新增 `backend/src/routes/models.ts`，定義：
  - `GET /api/models`
  - `POST /api/models`
  - `PATCH /api/models/:id`
  - `DELETE /api/models/:id`（409 錯誤含角色名稱說明）
- [x] 3.2 修改 `backend/src/server.ts`：import `modelsRouter` 並掛載至 `app.route("/api/models", modelsRouter)`

**驗收點**：`curl POST /api/models` 能新增；`DELETE` 被引用時回 HTTP 409。

---

## Wave 4：llmFactory 重構

- [x] 4.1 修改 `backend/src/services/llmFactory.ts`：
  - `getExecutorModel(modelSetting: ModelSetting, tools)` 參數從 `AiConfig` 改為 `ModelSetting`
  - `getSummarizerModel(modelSetting: ModelSetting)` 同上
  - 移除對 `AiConfig` 的 import

**驗收點**：`tsc` 編譯報錯，引導找出所有 `graph.ts` 中傳入 `AiConfig` 的呼叫點（預期 L78–79）。

---

## Wave 5：graph.ts 重構

- [x] 5.1 修改 `backend/src/graph.ts`，更新 `E2EGraphBuilder` 實例屬性（見設計決策 6）：
  - 移除 `private aiConfig!: AiConfig`
  - 新增 `private executorModelSetting!: ModelSetting`
  - 新增 `private reportModelSetting?: ModelSetting`
  - 新增 `private sendFailureScreenshot: boolean = true`
- [x] 5.2 修改 `E2EGraphBuilder.create()`：
  - 從 `settings.aiConfig.executorModelId` 查詢對應 `ModelSetting`；不存在則 `throw` 明確錯誤
  - 從 `settings.aiConfig.reportModelId` 查詢對應 `ModelSetting`；不存在則 `this.reportModelSetting = undefined`（不拋錯）
  - 從 `settings.sendFailureScreenshot`（頂層）讀取並存入 `this.sendFailureScreenshot`
  - 以 `ModelSetting` 物件呼叫重構後的 `getExecutorModel` / `getSummarizerModel`；若 `reportModelSetting` 為 undefined 則 `this.summarizer_model` 不初始化
- [x] 5.3 修改 `graph.ts` L451：將 `this.aiConfig?.sendFailureScreenshot` 改為 `this.sendFailureScreenshot`
- [x] 5.4 修改 `graph.ts` L442–498（summarizer block）：加入 null guard（見設計決策 7），`this.summarizer_model` 為 undefined 時直接跳過，`run.failureSummary` 保持 null

**驗收點**：有 ModelSetting 時測試正常執行；`executorModelId` 未設定時收到明確錯誤；`reportModelId` 未設定時測試可執行但 `failureSummary` 為 null。

---

## Wave 6：前端 UI

- [x] 6.1 新增 `frontend/src/views/ModelManageView.tsx`：
  - 列表展示（name、provider、model、description）
  - 右側 Drawer 新增/編輯：name、description、provider 下拉（google / openai）、apiKey、baseUrl（openai 才顯示）、model
  - `BaseDialog` 刪除確認：409 引用保護錯誤在 Dialog 內顯示
- [x] 6.2 在 `frontend/src/routes.tsx` 新增 `/models` 路由，側欄導航加入「模型管理」入口
- [x] 6.3 修改 `frontend/src/views/SettingsView.tsx`：
  - 移除舊有 AI 連線參數欄位（`aiConfigSchema` 的舊欄位）
  - AI 配置改為「執行器模型」與「報告器模型」下拉選單，從 `GET /api/models` 動態載入
  - `sendFailureScreenshot` Switch 移至 Playwright 設定區塊（頂層設定，非 aiConfig）
  - `executorModelId` 為空時顯示引導提示（連結至 `/models`）
- [x] 6.4 更新 `SettingsView` 的 Zod schema 與 `DEFAULT_AI_CONFIG`：移除舊欄位，加入 `executorModelId`、`reportModelId`；注意 `sendFailureScreenshot` 改為頂層 `settingsSchema` 的一部分

---

## Wave 7：功能驗證

- [ ] 7.1 前往模型管理頁面，新增兩個模型設定（Google Gemini 與 OpenAI Compatible），確認列表正確顯示
- [ ] 7.2 前往系統設定，在執行器與報告器下拉選單分別選擇已建立的模型，儲存後重新整理，確認設定持久化
- [ ] 7.3 嘗試刪除正在被角色引用的模型，確認後端回傳 409 且前端顯示角色名稱錯誤提示
- [ ] 7.4 `executorModelId` 未設定時嘗試執行測試，確認後端拒絕並回傳明確錯誤
- [ ] 7.5 `reportModelId` 未設定時執行失敗測試，確認 `failureSummary` 為 null（不 fallback）
