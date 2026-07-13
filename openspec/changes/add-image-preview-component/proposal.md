## Why

目前的測試管理介面在查看執行步驟的截圖時，僅使用簡單的 `<img>` 標籤，無法放大檢視細節。這在使用者的視覺斷言偵錯與分析測試失敗截圖時造成了極大的不便，特別是當頁面佈局複雜或截圖細節微小時。

## What Changes

- 引入 `react-photo-view` 輕量化圖片檢視庫。
- 新增共用的 `ImagePreview` 元件，封裝圖片檢視功能。
- 在 `StepAccordion.tsx` 的圖片渲染區域套用 `ImagePreview`，提供點擊放大檢視能力。

## Capabilities

### New Capabilities
- `image-preview`: 提供圖片彈出式放大、縮放、旋轉檢視功能。

### Modified Capabilities

## Impact

- 影響 `frontend/src/components/custom` 目錄，新增一個 `ImagePreview.tsx` 元件。
- 修改 `frontend/src/components/custom/StepAccordion.tsx` 的截圖顯示邏輯。
- 增加 `react-photo-view` 依賴。
