## Context

在目前的架構中：
1. `FormBlock.tsx` 透過 `react-hook-form` 的 `<FormProvider {...form}>` 封裝子表單元件。
2. `ModelManageView.tsx` 中的子表單 `ModelFields` 宣告了 `const form = useContext(FormContext)`，但 `FormContext` 是自訂宣告且未被 `FormBlock` 提供的 React Context，造成 `form` 恆為 `null`。
3. `ModelFields` 因而無法監聽到 `provider` 欄位的實時變化，使條件渲染 `{provider === "openai" && <FormField name="baseUrl" ... />}` 永遠無法被觸發。

## Goals / Non-Goals

**Goals:**
- 使用 `react-hook-form` 原生 Hook（`useWatch`）直接訂閱 `provider` 欄位變更，解決表單 Context 斷線問題。
- 確保新增與編輯模型時，切換為「OpenAI Compatible」皆能流暢展開 `baseUrl` 輸入框並正確保存與回填。
- 在模型列表 DataTable 的「供應商」欄位中，針對 OpenAI 模型附帶呈現其 `baseUrl`，提升使用者檢視效率。
- 移除無用的 `frontend/src/components/custom/form/FormContext.tsx`，保持程式碼簡潔。

**Non-Goals:**
- 不變更後端 API 或資料庫 Schema（後端既有設計已完整支援 `baseUrl`）。
- 不開放 Google Gemini 的 `baseUrl`（本變更專注於修復 OpenAI Compatible 的預期行為）。

## Decisions

### 1. 使用 `useWatch` 取代無效的自訂 Context
- **做法**：
  在 `ModelFields` 中使用 `react-hook-form` 的 `useWatch({ name: "provider" })`：
  ```tsx
  const provider = useWatch<ModelFormData>({ name: "provider" }) || "google";
  ```
- **Rationale**：
  `useWatch` 能自動掛鉤至上層 `FormProvider`，只在 `provider` 數值變更時觸發局部的精準重新渲染，既符合 `react-hook-form` 標準實踐，也完全解開對無效自訂 Context 的依賴。

### 2. 移除冗餘的 `FormContext.tsx`
- **做法**：
  刪除 `frontend/src/components/custom/form/FormContext.tsx`，並清理 `components/custom/form/index.ts` 中的匯出。
- **Rationale**：
  專案中所有表單元件（如 `FormField.tsx`）皆已全面使用 `react-hook-form` 內建的 `useFormContext`，自訂的 `FormContext` 既無 Provider 亦無其他消費者，屬於死代碼（dead code）。

### 3. 模型清單之 `baseUrl` 資訊呈現
- **做法**：
  在 `ModelManageView.tsx` 的 `columns` 定義中，當 `provider === "openai"` 時，於標籤下方展示格式化的端點字串（若有 `baseUrl` 則顯示其網址，若為空則顯示預設 `http://localhost:11434/v1`）。
- **Rationale**：
  OpenAI 相容模型大多指向不同的自建伺服器（Ollama、vLLM 等），在列表中直接可見端點網址能大幅降低辨識與維護成本。

## Risks / Trade-offs

- **[Trade-off] 表單重設生命週期**
  - *考量*：當使用者從 OpenAI 切換為 Google 時，原先輸入的 `baseUrl` 是否需清除？
  - *決定*：維持 `handleSubmit` 現有的策略：若提交時為 Google，將 `baseUrl` 自動規範化為空字串 `""`；若為 OpenAI 則保留輸入值，避免後端存入髒資料。
