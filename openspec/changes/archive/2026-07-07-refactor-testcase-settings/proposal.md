## Why

目前的測試案例編輯介面將「自然語言步驟」、「案例名稱」、「Cookies & LocalStorage (Storage)」、「環境變數」以及「刪除測試案例」全部擠在同一個編輯區塊（TestCaseEditBlock）中。這造成了以下問題：
- **編輯體驗混雜**：使用者在專注於調整測試步驟時，容易被其他與步驟無直覺關係的後設設定（如變數、Storage）干擾。
- **安全性低**：刪除按鈕與一般儲存按鈕放在同一個編輯區塊底部，存在誤觸風險。
- **偏離 Bento 設計系統**：專案的其他模組（例如專案設定）均採用分塊獨立儲存的 FormBlock 設計，而測試案例詳情頁仍使用傳統的大表單整頁儲存，破壞了設計的一致性。

## What Changes

我們將對測試案例詳情頁的佈局與編輯結構進行重構，具體變更如下：
- **解耦步驟與設定**：
  - **步驟分頁 (Steps Tab)**：僅保留步驟展示，以及編輯模式下「自然語言步驟」與「最終預期結果」的編輯。
  - **設定分頁 (Settings Tab)**：新增此分頁，用於集中管理「案例名稱」、「Storage 設定」、「環境變數」以及「危險區域操作」。
- **統一使用 FormBlock 元件**：
  - 設定分頁中的「基本資訊」、「Storage 設定」、「環境變數」與「危險區域」分別封裝為獨立的 Bento `FormBlock` 元件，各組件擁有獨立的儲存按鈕，並單獨發送 API 更新請求。
- **組件重構**：
  - 重構 `TestCaseEditBlock` 為僅供編輯步驟的元件。
  - 新增 `TestCaseFormGeneralBlock`、`TestCaseFormStorageBlock`、`TestCaseFormVariableBlock` 與 `TestCaseFormDangerBlock`。

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `testcase-management`: 調整測試案例的編輯與管理功能，將步驟邏輯與元數據/環境配置抽離至獨立分頁，並引入 FormBlock 獨立儲存機制。

## Impact

- `frontend/src/features/projects/pages/TestCaseDetailView.tsx` (主視圖修改，重構分頁控制與資料載入/更新邏輯)
- `frontend/src/features/projects/components/TestCaseEditBlock.tsx` (步驟編輯組件重構)
- 新增 `frontend/src/features/projects/components/` 下的四個 FormBlock 元件。
