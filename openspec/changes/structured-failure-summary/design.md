## Context

在目前的 E2E Manager 失敗總結器中，我們透過大模型（Gemini）對失敗的執行 logs 和截圖進行分析。
目前 AI 的回傳值已重構為符合 Zod Schema 的結構化輸出。
為了達到極致的類型安全與簡潔的前端代碼，我們決定將資料庫與 API 的 `failureSummary` 欄位直接升級為 **JSON / JSONB 物件**。這意味著我們將廢棄 Markdown 字串傳輸，不再需要在前後端進行 `JSON.parse` 或 `JSON.stringify` 手動轉換，也無需在前端保留脆弱的 Regex 正則解析。

## Zod Schema 設計

我們在後端定義並匯出 Zod Schema：

```typescript
import { z } from "zod";

export const FailureSummarySchema = z.object({
  step: z
    .string()
    .describe("發生錯誤的具體步驟編號或內容。"),
  reason: z
    .string()
    .describe("失敗的根本原因詳細分析。"),
  suggestion: z
    .string()
    .describe("給開發者的具體修復與改善建議（可包含 Markdown 列表或加粗語法，以維持良好的排版結構）。"),
});

export type FailureSummaryData = z.infer<typeof FailureSummarySchema>;
```

## 後端異動設計

### 1. `backend/src/entities/TestRun.ts`
將 `failureSummary` 的資料庫型別從 `text` 變更為 `jsonb`，並對齊 TypeScript 的物件型別：

```typescript
  @Column("jsonb", { nullable: true })
  failureSummary?: {
    step: string;
    reason: string;
    suggestion: string;
  };
```

### 2. `backend/src/services/llmFactory.ts`
保持不變。`getSummarizerModel` 依然使用 `withStructuredOutput(FailureSummarySchema)` 回傳結構化模型。

### 3. `backend/src/graph.ts` 的 `reporterNode`
- 呼叫 `summarizer_model.invoke(messages)`，回傳的 response 將直接是 Zod 物件。
- 直接將該物件賦值給 `run.failureSummary`（不再需要 `JSON.stringify`）：
  ```typescript
  run.failureSummary = response;
  ```
- 發生錯誤時的例外處理機制（Fallback）：
  ```typescript
  } catch (e: any) {
    run.failureSummary = {
      step: "無法確定（總結生成失敗）",
      reason: `AI 總結生成出錯：${e.message}`,
      suggestion: "請手動檢查步驟日誌與執行截圖以進行排查。",
    };
  }
  ```

---

## 前端異動設計

### 1. `frontend/src/types/api.ts`
更新 `TestRun` 介面的 `failureSummary` 欄位型別，對齊強型別物件：

```typescript
export interface TestRun {
  // ...
  failureSummary?: {
    step: string;
    reason: string;
    suggestion: string;
  };
}
```

### 2. `frontend/src/components/custom/AIFailureSummaryPanel.tsx`
- 徹底移除所有的 Regex 匹配提取邏輯，也無需進行 `JSON.parse`。
- `AIFailureSummaryPanel` 直接解構 `summary` 屬性，類型安全地渲染 Bento Card 佈局。

---

## 驗證與資料遷移計畫

### 1. 舊數據清理 (Data Cleansing)
由於 Postgres 在將 `text` 欄位轉換為 `jsonb` 時，若遇到非 JSON 格式的舊 Markdown 數據會導致 TypeORM schema 同步失敗，我們必須在部署變更前，先將 `test_run` 表的 `failureSummary` 欄位全部清空：
```sql
UPDATE test_run SET "failureSummary" = NULL;
```

### 2. 自動化測試
- 執行 `npm test`，確保狀態機與後端模型建立的單元測試不被破壞。

### 3. 手動驗證
1. 執行一次失敗測試，確認資料庫中寫入的是符合 `jsonb` 格式的強型別資料。
2. 驗證前端能完美、無解析偏差地顯示 Bento Card 內容。
