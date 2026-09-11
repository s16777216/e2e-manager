## Why

在模型管理頁面（`ModelManageView.tsx`）中，`ModelFields` 元件錯誤地使用了未被 `FormBlock` 提供的自訂 `useContext(FormContext)`，導致其內部表單監聽永遠回傳 `null`，進而使得 `provider` 欄位永遠退回預設值 `"google"`。
這造成使用者在建立或編輯 OpenAI Compatible 模型時，`baseUrl` 輸入欄位完全被隱藏且無法被渲染或設定，無法對接本機或自建的 OpenAI 相容端點（如 Ollama、vLLM 或第三方代理網關）。

## What Changes

- **修復模型表單響應邏輯**：在 `ModelManageView.tsx` 中將 `ModelFields` 的表單狀態監聽改為 `react-hook-form` 原生的 `useWatch({ name: "provider" })`，確保當選擇「OpenAI Compatible」或編輯 OpenAI 模型時，`baseUrl` 輸入框能正常即時展開。
- **模型列表端點顯示優化**：在 `ModelManageView.tsx` 的表格清單中，針對 OpenAI Compatible 模型於供應商標籤旁呈現其設定之 `baseUrl`，提升模型端點設定的可見度。
- **清理廢棄程式碼**：移除未被提供且無其他元件引用的 `frontend/src/components/custom/form/FormContext.tsx`。

## Capabilities

### New Capabilities
<!-- 無新增獨立 capability，此項擴充既有 model-management 範疇 -->

### Modified Capabilities
- `model-management`: 修正模型管理 UI 表單在切換供應商時的動態欄位響應性，確保 OpenAI Compatible 模型的 `baseUrl` 能正常輸入、回填與檢視。

## Impact

- **Frontend**:
  - `frontend/src/views/ModelManageView.tsx`：替換無效的 Context 為 `useWatch`，並於列表中展示 `baseUrl`。
  - `frontend/src/components/custom/form/FormContext.tsx`：清理 dead code。
- **Backend / Database**:
  - 無需變更。後端 `ModelSetting` 資料表、`modelsRouter` API 與 `llmFactory.ts` 已完整支援 `baseUrl` 存儲與調用。
