## Why

目前的測試案例步驟編輯仍使用獨立的大編輯卡片表單，每次修改均須使整組步驟全部進入編輯框，這在編輯個別步驟時顯得笨重且不直覺。
我們希望改成行內步驟編輯（Inline Step Editing），使每個步驟 Item 項目右側設有編輯按鈕，點擊後僅該項目就地展開為編輯框，提升步驟管理的流暢度。

## What Changes

我們將重構步驟編輯器為行內編輯架構：
- **行內步驟編輯**：
  - 步驟列表的每一個 Item 改為可就地切換「唯讀/編輯」狀態的獨立元件。
  - Hover 時右側浮現控制按鈕 (編輯、刪除、上下移動)。
- **即時單步 API 同步**：
  - 編輯現有步驟、刪除步驟以及調整步驟順序均立刻呼叫 API 更新後端資料。
- **混合新增資料流**：
  - 在步驟列表的最下方提供一個寬度 100% 的 Bento 虛線卡片按鈕 (樣式 B) 作為新增入口。
  - 點擊「新增步驟」時，先在前端的 `steps` 狀態末尾塞入空白暫存項，並自動令其進入行內編輯模式，此時**不**呼叫 API。
  - 當點擊該新增項目的「儲存」按鈕時，才呼叫 API 正式將其存入資料庫。
- **移除舊編輯卡片與頂部控制鈕**：
  - 移除原先用於全頁編輯步驟的 `TestCaseEditBlock.tsx` 元件。
  - 將「新增步驟」按鈕從頂部控制列移除，改在步驟列表下方呈現。

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `testcase-management`: 重構測試案例步驟編輯功能，實作行內編輯與即時 API 同步之混合更新資料流。

## Impact

- 移除 `frontend/src/features/projects/components/TestCaseEditBlock.tsx`
- 新增 `frontend/src/features/projects/components/TestCaseStepItem.tsx` (行內步驟項目)
- 修改 `frontend/src/features/projects/pages/TestCaseDetailView.tsx` (整合 Steps 分頁與行內編輯狀態管理)
