# Architectural Design: Single Testcase Direct Log Navigation

## Context

See `proposal.md` for the motivation. The current implementation already creates the `Task` and its single `TestRun` before returning from `POST /testcases/:id/run`. That endpoint is implemented in `backend/src/routes/run.ts` and returns `{ taskId, runs: TaskRun[] }` with HTTP 202.

`GET /tasks` already loads each task's related runs and testcase/project chain, but its formatted response omits `runs`. `Task` and the trigger API client already model `runs?: TaskRun[]` and `runs: TaskRun[]` respectively. HistoryView currently navigates every task to TaskDetailView on double-click. SSEConsoleView first fetches the current Run state and then subscribes to SSE while it remains pending or running, so direct navigation does not depend on receiving the initial queued event.

## Goals / Non-Goals

**Goals:**

- Reuse the existing trigger response contract and `TaskRun` shape.
- Make Run selection deterministic for global task history.
- Preserve a usable fallback when Run metadata is absent.
- Prevent navigation with an invalid project context.

**Non-Goals:**

- No database schema changes or new dependencies.
- No change to SSEConsoleView streaming or rendering behavior.
- No change to project/group batch execution navigation.
- No single-click navigation behavior.

## Decisions

### 1. Reuse the existing single-testcase trigger response

TestCaseDetailView will read `res.runs[0]?.runId` from the existing `{ taskId, runs: TaskRun[] }` response. `backend/src/routes/run.ts` and the `api.triggerRun` response type remain unchanged.

This avoids the rejected alternatives of adding a duplicate top-level `runId` or replacing the existing response with `{ success, taskId, runId }`, either of which would create unnecessary contract churn.

### 2. Return ordered TaskRun summaries from global history

`GET /tasks` will return a complete `TaskRun[]` summary for every task. The runs relation will be ordered by `createdAt ASC`, and each public item will be mapped to the existing shape:

```typescript
{
  runId: run.id,
  testcaseId: run.testcase?.id ?? null,
  testcaseName: run.testcase?.name ?? "未知案例",
  status: run.status,
}
```

HistoryView will use `row.runs?.[0]?.runId` only when `row.scope === "testcase"`. Although a correctly formed single-testcase task has exactly one Run, the array access remains guarded for legacy or inconsistent records.

Returning the existing array shape was selected instead of adding a special top-level `runId`. Returning summaries for every scope also keeps the task list response structurally consistent.

### 3. Keep double-click navigation and apply explicit fallbacks

HistoryView will continue to use `onRowDbClick`:

- When `projectId` is absent, show an error toast and remain in HistoryView.
- When the scope is `testcase` and `runs[0].runId` exists, navigate directly to SSEConsoleView.
- When the scope is `testcase` but the Run ID is absent, show a warning toast and navigate to TaskDetailView.
- When the scope is `project` or `group`, navigate to TaskDetailView.

The existing `"unknown"` project fallback will be removed because it constructs a route that cannot resolve valid project context.

### 4. Fall back from TestCaseDetailView when the trigger response has no Run

After triggering a single testcase, TestCaseDetailView will navigate directly when `res.runs[0]?.runId` exists. If it does not, the view will show a warning toast and navigate to `/project/:projectId/tasks/:taskId`. The page already has a valid route `projectId`, so this fallback remains actionable.

### 5. Verify both contracts and user-visible navigation

Verification will include the inherited backend test command, a monorepo build, and manual coverage of these paths:

- Trigger a single testcase and enter its live Run directly.
- Double-click a single-testcase History row and enter its Run directly.
- Double-click project/group History rows and retain TaskDetailView navigation.
- Exercise missing Run and missing project metadata fallbacks.

## Risks / Trade-offs

- **[Risk] Larger History response payload** → `GET /tasks` is already capped at 100 tasks and will return compact `TaskRun` summaries rather than serialized entities.
- **[Risk] Legacy or inconsistent single-testcase tasks have no Run** → Guard array access, show a warning, and retain TaskDetailView as the fallback.
- **[Risk] A task cannot resolve its project** → Show an error and do not navigate instead of constructing a `project/unknown` URL.
- **[Risk] Frontend deploys before the History response includes runs** → Treat missing `runs` as the supported fallback path, allowing mixed-version deployment.

## Migration Plan

No data migration is required. Deploy the additive `GET /tasks` response first, then deploy the frontend navigation change. For rollback, restore the frontend's TaskDetailView-only navigation; the additional `runs` response can remain without affecting older clients.
