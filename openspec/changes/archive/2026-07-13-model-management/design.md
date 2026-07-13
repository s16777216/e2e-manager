## Context

目前 `SystemSetting.aiConfig` 是一個 JSONB 欄位，直接儲存 AI 模型的連線資訊（provider、apiKey、baseUrl、model 名稱）與角色分配混雜在一起。`llmFactory.ts` 的 `getExecutorModel` 與 `getSummarizerModel` 直接從這個扁平結構讀取參數。此設計在只有兩個 AI 角色時尚可接受，但隨著未來角色增加（執行器、報告器、斷言器、規劃器等），同樣的連線參數會被複製多份，且無法跨角色共用同一個模型連線設定。

## Goals / Non-Goals

**Goals:**
- 建立獨立的 `model_setting` Table 管理 LLM 連線設定（name, provider, apiKey, baseUrl, model）
- `SystemSetting.aiConfig` 改為以 `ModelId` 引用方式指定角色（`executorModelId`, `reportModelId`）
- 提供完整的模型管理 API（CRUD）與 UI 頁面
- 刪除時若模型正被引用則拒絕並告知使用者
- 執行測試前若 `executorModelId` 未設定或模型不存在則拒絕執行
- `sendFailureScreenshot` 移至 `SystemSetting` 頂層

**Non-Goals:**
- 不提供舊 `aiConfig` 資料的自動 Migration（使用者手動重設）
- 不支援每個測試案例覆蓋模型設定（全域設定即可）
- 不實作模型連線測試（ping/validate）功能

## Decisions

### 決策 1：`ModelSetting` 作為獨立 DB Table

**選擇**：新增 `model_setting` TypeORM Entity，以 UUID 為主鍵。

**理由**：
- 與 `SystemSetting` 完全解耦，可被多個角色引用，不重複儲存連線參數
- 可擴展（未來加角色只需在 `aiConfig` 加一個 `xxxModelId` 欄位）
- 刪除保護邏輯清楚（查詢 `aiConfig` 中是否含有該 ID）

**排除替代方案**：將多個 ModelSetting 以 Array 塞進 `SystemSetting.aiConfig` JSONB——此方案難以做 FK 查詢保護且失去獨立管理的靈活性。

---

### 決策 2：`llmFactory` 接受 `ModelSetting` 物件而非 `aiConfig`

**選擇**：重構 `getExecutorModel(modelSetting, tools)` 與 `getSummarizerModel(modelSetting)`，參數從整個 `aiConfig` 改為單一 `ModelSetting` 物件。

**理由**：
- 函式職責單純：只負責「給我一個模型物件，我建立 LLM 實例」
- 呼叫端（`graph.ts`）負責從 DB 查詢正確的 `ModelSetting`
- 未來加入新角色只需在 `graph.ts` 查詢對應 ID，不需要改 `llmFactory`

---

### 決策 3：刪除保護在 Service 層實作

**選擇**：`modelService.deleteModel(id)` 先查詢 `SystemSetting.aiConfig` 所有 `xxxModelId` 欄位是否含有該 ID，有則拋出業務錯誤（HTTP 409）。

**理由**：不依賴 DB FK constraint（JSONB 內的 ID 無法加 FK），在 Service 層明確做引用檢查，錯誤訊息可以精確告知「正被 [執行器] 使用」。

---

### 決策 4：`sendFailureScreenshot` 移至頂層

**選擇**：在 `SystemSetting` Entity 新增 `sendFailureScreenshot: boolean` 欄位（頂層，非 JSONB 內）。

**理由**：此欄位是「執行行為設定」而非「模型連線參數」，語意上屬於系統設定頂層，不應與模型引用混在同一個 JSONB 結構中。

---

### 決策 5：Migration 策略——直接廢棄舊格式

**選擇**：`aiConfig` JSONB 結構破壞性變更，舊資料在升級後直接失效，使用者須手動重新設定。

**理由**：專案目前仍在開發階段，自動 Migration（把舊格式轉成一筆 ModelSetting 並回填 ID）會增加不必要的複雜度。UI 應在 `executorModelId` 為空時顯示明確引導提示。

## Risks / Trade-offs

- **使用者體驗斷裂**：現有使用者升級後所有 AI 設定失效，須重新操作。→ 緩解：UI 在設定頁面顯示醒目的「需要重新設定模型」提示，並導引至模型管理頁面。
- **JSONB 引用無 DB FK 保護**：如果未來有直接操作 DB 的情況，可能繞過 Service 層的刪除保護。→ 接受此風險，應用層保護已足夠。
- **`aiConfig` JSONB 結構仍在演進**：未來新增角色（assertorModelId 等）需要再次修改 Schema，但影響小（JSONB 欄位加 key 不需要 migration）。

---

### 決策 6：`E2EGraphBuilder` Instance 屬性重構

**選擇**：移除 `this.aiConfig: AiConfig`，改為明確分離三個屬性：

```ts
private executorModelSetting!: ModelSetting;   // 必須存在，否則在 create() 拋錯
private reportModelSetting?: ModelSetting;     // 可 undefined，代表跳過報告
private sendFailureScreenshot: boolean = true; // 從 settings 頂層讀取
```

**理由**：
- 語意比 `this.aiConfig` 更清晰，每個 Runnable 的來源一目了然
- `reportModelSetting` 的 undefined 狀態直接作為「skip 報告」的訊號，不需要額外 flag
- `sendFailureScreenshot` 原本從 `this.aiConfig.sendFailureScreenshot` 讀取（`graph.ts` L451），移頂層後改從 `settings.sendFailureScreenshot` 讀取並存入此屬性

---

### 決策 7：`summarizer_model` 為 null 時的 skip 邏輯

**選擇**：在 `graph.ts` 的 summarizer node（目前 L442–498）加入 null guard：

```ts
if (!this.summarizer_model) {
  // reportModelId 未設定或模型不存在，跳過報告生成
  // run.failureSummary 保持 null/undefined
} else {
  // 原有 AI 總結邏輯
}
```

**理由**：現有程式碼直接 `await this.summarizer_model.invoke(messages)` 無 null check。將 `undefined` summarizer 作為明確的「不報告」訊號，符合 spec 的「skip，不 fallback」語意，且無需在 router 層增加條件判斷。

---

### 決策 8：模型管理 UI 操作模式

**選擇**：`ModelManageView` 採用「列表檢視 + 抽屜（Drawer）新增/編輯 + Dialog 刪除確認」模式。

**理由**：
- **Drawer**：模型表單欄位較多（name、provider、apiKey、baseUrl、model），抽屜比彈窗提供更充裕的垂直空間；provider 條件顯示欄位（OpenAI 才顯示 baseUrl）在抽屜中視覺上更自然
- **Dialog 刪除**：刪除是破壞性操作，需二次確認；409 引用保護錯誤訊息在 Dialog 內顯示更醒目
- 與既有 `BaseDialog` 元件保持一致（設定頁的「清除歷史」採相同模式）

## Migration Plan

1. 新增 `model_setting` TypeORM Entity → TypeORM 自動建立 Table（`synchronize: true` 環境）或手動 migration
2. 在 `SystemSetting` Entity 頂層新增 `sendFailureScreenshot` 欄位（DB 層加欄位）
3. 更新 `SystemSetting.aiConfig` 型別定義（移除舊欄位，加入 `xxxModelId`）
4. 舊 `aiConfig` 資料在下次 `POST /api/settings` 儲存前仍保留在 DB（不影響新邏輯，新邏輯只讀 `executorModelId` 等）
5. 使用者首次進入設定頁面時，看到「模型未設定」提示，手動完成設定

**Rollback**：直接回滾 code，舊 `aiConfig` 資料仍在 DB 中（未被清除）。

## Open Questions

（已無未決問題；原有疑問已納入決策 7 與決策 8。）
