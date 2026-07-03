## 1. 資料庫與 API 擴充

- [ ] 1.1 於 `backend/src/entities/TestRun.ts` 的 `TestRun` 類別中，新增 `failureSummary` 欄位（型別為 `text`，可為空 `nullable: true`）。
- [ ] 1.2 於 `backend/src/routes/run.ts` 的 `/runs/:runId` 路由處理器中，在回傳的 JSON 物件中加入 `failureSummary: run.failureSummary` 欄位。

## 2. LLM 模型配置與 Prompt 設計

- [ ] 2.1 於 `backend/src/services/llmFactory.ts` 匯出 `getSummarizerModel(aiConfig: AiConfig)` 函式，建立專用於總結的 LLM 實例，不繫結工具，`temperature` 設為 `0.2`。
- [ ] 2.2 於 `backend/src/graph/prompt.ts` 新增並匯出 `buildFailureSummarizerSystemPrompt` 函式，建構分析失敗原因的系統提示詞，規範輸出繁體中文的「失敗步驟」、「原因分析」與「改善建議」三大結構。

## 3. 測試工作流（LangGraph）與報告整合

- [ ] 3.1 於 `backend/src/graph.ts` 的 `reporterNode` 內，判斷最終測試結果是否為 `FAIL` 或 `ERROR`。
- [ ] 3.2 若測試失敗，呼叫 `getSummarizerModel` 與 `buildFailureSummarizerSystemPrompt`，將測試執行日誌（Log）、預期結果及失敗畫面截圖（以 Base64 image_url 格式，若有截圖）傳入 LLM 以生成總結。
- [ ] 3.3 將生成的總結寫入 `run.failureSummary` 並儲存至資料庫中；處理當瀏覽器崩潰無截圖時的純文字 Fallback 邏輯。
- [ ] 3.4 於 `reporterNode` 發送任務結束通知 `pg_notify('test_run_logs', ...)` 的 JSON payload 中加入 `failureSummary` 屬性。
- [ ] 3.5 於 `backend/src/reporter.ts` 的 `generateReport` 函式中，當測試失敗或出錯時，將 `state.failure_summary` 或 `run.failureSummary` 的內容格式化後嵌入 Markdown 報告的「測試摘要」章節。

## 4. 前端資料型別與事件對接

- [ ] 4.1 於 `frontend/src/types/api.ts` 的 `TestRun` 介面中新增 `failureSummary?: string;` 欄位。
- [ ] 4.2 於 `frontend/src/hooks/useSSEStream.ts` 的 `completed` 事件處理器中，在更新 `runStatus` 時，解構並填入 `failureSummary: payload.failureSummary`。

## 5. 前端 UI 組件與展示

- [ ] 5.1 於 `frontend/src/components/custom/AIFailureSummaryPanel.tsx` 建立「AI 失敗分析與建議」面板組件。解析失敗總結內容，將「失敗步驟」、「原因分析」、「修復建議」以美觀的 Bento Card 佈局分別呈現在卡片中，並以 `bg-rose-950/20 border-rose-500/30 text-rose-200` 等專屬色調進行視覺渲染。
- [ ] 5.2 於 `frontend/src/views/SSEConsoleView.tsx` 中，當 `runStatus.status === "failed" | "error"` 且有 `failureSummary` 時，在頂部的結果區塊下方渲染 `AIFailureSummaryPanel`。
- [ ] 5.3 於 `frontend/src/features/projects/pages/TestCaseDetailView.tsx` 中，在對應失敗的 TestRun 詳細資訊區塊渲染 `AIFailureSummaryPanel`。

## 6. 功能驗證與測試

- [ ] 6.1 啟動後端與前端服務，觸拉一個刻意會失敗的測試（例如包含不存在的元素或無法達成的視覺斷言）。
- [ ] 6.2 驗證後端控制台是否呼叫 LLM 進行總結，確認資料庫是否正確寫入該總結，且產出的 `report.md` 是否包含此總結。
- [ ] 6.3 驗證前端 SSE 控制台與歷史詳細頁面是否能即時渲染出美觀的「AI 失敗分析與建議」Bento 卡片。
