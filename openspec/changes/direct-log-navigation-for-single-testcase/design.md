# Architectural Design: Single Testcase Direct Log Navigation

## 1. Sequence Diagram (資料流與跳轉時序圖)

### Scenario A: 從執行紀錄列表進入 (From History View)

```
[User] ──(Double Click Row)──> [HistoryView]
                                      │
                                      ├─ 1. Check row.scope === 'testcase' && row.runId
                                      │
                       ┌──────────────┴──────────────┐
                    (True)                        (False)
                       │                             │
                       ▼                             ▼
       Navigate to SSEConsoleView            Navigate to TaskDetailView
       `/project/:projectId/run/:runId`      `/project/:projectId/tasks/:taskId`
```

### Scenario B: 從測試案例詳情觸發執行 (From TestCase Detail View)

```
[User] ──(Click Run Button)──> [TestCaseDetailView]
                                        │
                                        ├─ 1. POST /api/testcases/:id/run
                                        │
                                [Backend REST API]
                                        │
                                        ├─ 2. Create Task & TestRun
                                        └─ 3. Return { success: true, taskId, runId }
                                        │
                                        ▼
                           Navigate to SSEConsoleView
                       `/project/:projectId/run/:runId`
```

---

## 2. Detailed Technical Design & Code Modifications (詳細技術實作規範)

### Step 1: 後端 Route - 全域任務 API (`backend/src/routes/task.ts`)

在 `GET /tasks` 處理函式中，變更格式化地回傳資料 `formatted`。
由於 SQL 查詢已有 `relations: { runs: ... }`，故 `t.runs` 已被載入：
- 對於單一案例任務（或任意任務），計算 `firstRunId`：
  `const runId = t.runs?.[0]?.id || null;`
- 在回傳 JSON 物件中加入 `runId` 屬性。

#### 變更前：
```typescript
return {
  id: t.id,
  scope: t.scope,
  scopeId: t.scopeId,
  status: t.status,
  totalCount: t.totalCount,
  doneCount: t.doneCount,
  createdAt: t.createdAt,
  finishedAt: t.finishedAt,
  projectId,
  projectName,
  totalTokens
};
```

#### 變更後：
```typescript
return {
  id: t.id,
  scope: t.scope,
  scopeId: t.scopeId,
  status: t.status,
  totalCount: t.totalCount,
  doneCount: t.doneCount,
  createdAt: t.createdAt,
  finishedAt: t.finishedAt,
  projectId,
  projectName,
  totalTokens,
  runId: t.runs?.[0]?.id || null // 新增 runId
};
```

---

### Step 2: 後端 Route - 觸發單一案例執行 API (`backend/src/routes/testcase.ts`)

在 `POST /testcases/:id/run` 端點：
- 系統建立 `task` 與 `run` 後，`run.id` 即為本次生成的執行紀錄 ID。
- 原回應為 `return c.json({ success: true, taskId: task.id })`。
- 修改為 `return c.json({ success: true, taskId: task.id, runId: run.id })`。

---

### Step 3: 前端 API 型態定義 (`frontend/src/types/api.ts`)

在 `Task` 介面中加入 `runId`：

```typescript
export interface Task {
  id: string;
  scope: "project" | "group" | "testcase";
  scopeId: string;
  status: "pending" | "running" | "passed" | "failed" | "error";
  totalCount: number;
  doneCount: number;
  createdAt: string;
  finishedAt?: string | null;
  runs?: TaskRun[];
  projectId?: string;
  projectName?: string;
  totalTokens?: number;
  runId?: string | null; // 新增此欄位
}
```

同時，確認 API 呼叫方法 `api.triggerRun(testcaseId)` 的回傳型態定義 (`frontend/src/lib/api.ts`)：
```typescript
triggerRun: (testcaseId: string) =>
  request<{ success: boolean; taskId: string; runId: string }>(
    `/testcases/${testcaseId}/run`,
    { method: "POST" }
  ),
```

---

### Step 4: 前端全域執行紀錄跳轉 (`frontend/src/views/HistoryView.tsx`)

修改 `DataTable` 的 `onRowDbClick` 行點擊事件：

#### 變更前：
```typescript
onRowDbClick={(row) =>
  navigate(`/project/${row.projectId || "unknown"}/tasks/${row.id}`)
}
```

#### 變更後：
```typescript
onRowDbClick={(row) => {
  if (row.scope === "testcase" && row.runId) {
    navigate(`/project/${row.projectId || "unknown"}/run/${row.runId}`);
  } else {
    navigate(`/project/${row.projectId || "unknown"}/tasks/${row.id}`);
  }
}}
```

---

### Step 5: 前端測試案例詳情頁執行跳轉 (`frontend/src/features/projects/pages/TestCaseDetailView.tsx`)

修改 `handleRunTestCase` 方法：

#### 變更前：
```typescript
const handleRunTestCase = async () => {
  if (!testCaseId) return;
  setIsTriggering(true);
  try {
    const res = await api.triggerRun(testCaseId);
    toast.success("測試任務已啟動！正在轉跳監控頁面...");
    // 跳轉到 Task 監控頁面
    navigate(`/project/${projectId}/tasks/${res.taskId}`);
  } catch (err: unknown) {
    // ...
  }
};
```

#### 變更後：
```typescript
const handleRunTestCase = async () => {
  if (!testCaseId) return;
  setIsTriggering(true);
  try {
    const res = await api.triggerRun(testCaseId);
    toast.success("測試任務已啟動！正在轉跳監控頁面...");
    // 跳轉到 SSE 即時日誌監控頁面 (傳入 res.runId)
    if (res.runId) {
      navigate(`/project/${projectId}/run/${res.runId}`);
    } else {
      navigate(`/project/${projectId}/tasks/${res.taskId}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    toast.error("執行測試失敗：" + msg);
  } finally {
    setIsTriggering(false);
  }
};
```

---

## 3. Boundary Conditions & Safeguards (邊界情況與防護措施)

1. **`runId` 為空時的降級處理 (Fallback)**：
   若因舊版本資料庫紀錄或非預期狀態導致 `row.runId` 或 `res.runId` 為空值 (`null`/`undefined`)，系統 MUST 自動降級備援跳轉至批次任務頁面 `/project/:projectId/tasks/:taskId`。
2. **`projectId` 為空時的備援處理**：
   保持現有備援字串 `"unknown"`。
