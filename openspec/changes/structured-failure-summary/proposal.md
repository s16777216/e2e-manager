## Why

目前的「AI 失敗分析與建議」功能在後端是產生純 Markdown 文字，並在前端使用正則表達式（Regex）進行硬性拆分，以填入 Bento Card 的三個區塊（失敗步驟、根本原因、改善建議）。

這種設計具有高度的不確定性：
1. **Regex 解析脆弱**：當大模型輸出的 Markdown 編號、標點符號、或引導標題有微小改變時，Regex 便會解析失敗，導致前端無法呈現 Bento 網格，而必須退回到粗糙的純文字渲染。
2. **缺乏類型安全**：前後端傳輸沒有明確的合約（Schema）保護。

因此，本變更旨在將 AI 總結器重構為**結構化輸出（Structured Output）**，直接由大模型產生 JSON 結構，提高系統的強健性與排版美感。

## What Changes

- **後端 Zod 定義**：於後端新增 Zod Schema 定義 `{ step: string, reason: string, suggestion: string }`，規範 AI 總結器的輸出格式。
- **後端模型重構**：更新 `llmFactory.ts` 中的 `getSummarizerModel`，套用 `.withStructuredOutput()` 綁定 Schema。
- **後端狀態機變更**：
  - 更新 `graph.ts` 中 `reporterNode` 的調用，直接取得結構化物件。
  - 將結構化物件 `JSON.stringify` 後持久化儲存於 `TestRun.failureSummary` 資料庫欄位中。
- **前端 UI 解析重構**：
  - 更新 `AIFailureSummaryPanel.tsx`，移除所有的 Regex 正則匹配邏輯。
  - 改為直接對 `summary` 欄位進行 `JSON.parse` 取得 `{ step, reason, suggestion }`，並型別安全地渲染 Bento Grid。
  - 仍保留 `try-catch` 解析 Fallback 機制，相容舊有未結構化的文字紀錄。

## Capabilities

### Modified Capabilities
- `failure-summarizer`: 重構 AI 失敗原因分析，使其由 Markdown 純文字產生改為 Zod 結構化 JSON 輸出，並持久化至資料庫。
- `step-assertion-and-reporting`: 前端面板改由解析結構化 JSON，並型別安全地呈現在 Bento Card 佈局中。
