## Context

目前的測試案例步驟編輯仍使用獨立的大編輯卡片表單。當點擊「編輯步驟」時，整組步驟全部進入編輯框，這在編輯個別步驟時顯得笨重且不直覺。
為了提升步驟管理的流暢度，我們將重構為 **「行內步驟編輯（Inline Step Editing）」**。

## Goals / Non-Goals

**Goals:**
- 封裝 `TestCaseStepItem` 元件以處理單個步驟的唯讀與編輯狀態。
- 滑鼠移至步驟時，右側浮現「編輯」、「刪除」與「上下移動」按鈕。
- 編輯步驟、刪除步驟以及調整順序均立刻呼叫 API 進行資料庫儲存。
- 新增步驟在點擊「+ 新增步驟」時，先在前端的 `steps` 狀態末尾塞入空白暫存項，並自動進入行內編輯模式，此時不呼叫 API。點擊「儲存」時才呼叫 API 寫入資料庫；點擊「取消」則直接從前端陣列中濾除。此新增按鈕入口被移至步驟列表的最下方，呈現為 Bento 虛線卡片樣式 (樣式 B)。
- 移除舊有的 `TestCaseEditBlock.tsx` 元件。

**Non-Goals:**
- 不改變專案 (Project) 或群組 (Group) 相關的 UI 與設定邏輯。
- 不修改後端的測試案例 API 定義，完全沿用現有的 `/api/testcases/:id`。

## Decisions

### 1. 新增 `TestCaseStepItem` 組件
* **決定**：將單個步驟封裝為獨立的 React 元件。
  - **Props 定義**：
    ```typescript
    interface TestCaseStepItemProps {
      step: { action: string; expected?: string; hasExpected: boolean };
      index: number;
      isEditing: boolean;
      totalSteps: number;
      onEditStart: () => void;
      onCancel: () => void;
      onSave: (updatedStep: { action: string; expected?: string; hasExpected: boolean }) => Promise<void>;
      onDelete: () => Promise<void>;
      onMove: (direction: "up" | "down") => Promise<void>;
      isSaving?: boolean;
    }
    ```
  - **設計細節**：
    - 唯讀狀態下，使用 Tailwind 或是 CSS 的 `group` 樣式，滑鼠移入項目時右側按鈕區才顯現，使介面維持簡潔與專注。
    - 編輯狀態下，顯示輸入操作描述的 `Input`、控制預期結果的 `Switch` 以及預期結果 `Input`。

### 2. 狀態管理與 API 呼叫 (在 `TestCaseDetailView.tsx` 中)
* **決定**：在 `TestCaseDetailView` 中維護 `testcase` 與 `editingIndex: number | null` 狀態：
  - **新增步驟**：
    ```typescript
    const handleAddStep = () => {
      if (editingIndex !== null) return;
      const newSteps = [...(testcase.steps || [])];
      newSteps.push({ id: "", stepIdx: newSteps.length, action: "", expected: "", hasExpected: false });
      setTestcase({ ...testcase, steps: newSteps });
      setEditingIndex(newSteps.length - 1);
    };
    ```
  - **按鈕佈局與樣式 B**：
    將「新增步驟」按鈕從頂部控制列右側移除。在步驟列表 (`testcase.steps.map(...)`) 的正下方，渲染一個寬度 100% 且帶有虛線邊框 (`border-dashed`) 的卡片式按鈕。
    當 `editingIndex !== null` 時，該按鈕會進入 `disabled` 狀態以避免狀態衝突。
  - **單步儲存**：
    呼叫 API `api.updateTestcase(testCaseId, { ...testcase, steps: newSteps })`。
    成功後，重置 `editingIndex = null` 並呼叫 `loadTestCaseData()` 重新載入最新資料。
  - **單步取消**：
    若該步驟為未儲存過的新步驟（`action === ""`），則點選取消時直接在前端從 `steps` 陣列中移除；若為現有步驟，則僅關閉編輯狀態（將 `editingIndex` 設回 `null`）。

## Risks / Trade-offs

- **[Risk] 使用者同時點選其他步驟進行編輯**
  - **Mitigation**：當 `editingIndex !== null` 時，其餘唯讀項目的「編輯」按鈕將會被禁用，且列表下方的「新增步驟」卡片按鈕也會被禁用，藉此防範使用者同時編輯多個步驟所導致的狀態衝突。
