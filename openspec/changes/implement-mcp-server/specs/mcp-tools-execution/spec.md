## ADDED Requirements

### Requirement: MCP tool run_test_case executes single test case
The system SHALL provide `run_test_case` tool that queues a test case for execution via the existing task queue.

#### Scenario: Run test case returns task and run IDs
- **WHEN** client calls `run_test_case` with `{testcaseId: "tc_123"}`
- **THEN** Task entity created with `scope: "testcase"`, `scopeId: "tc_123"`
- **THEN** TestRun entity created linked to task and test case
- **THEN** tool returns `{taskId, runId, status: "pending"}`
- **THEN** database NOTIFY triggers worker to pick up job

### Requirement: MCP tool run_group executes all test cases in group tree
The system SHALL provide `run_group` tool that recursively finds all test cases in a group and its descendants, creates a batch task.

#### Scenario: Run group creates task with multiple runs
- **WHEN** client calls `run_group` with `{groupId: "grp_123"}`
- **THEN** all descendant groups' test cases collected
- **THEN** Task created with `scope: "group"`, `totalCount` = test case count
- **THEN** one TestRun per test case created, all linked to same task
- **THEN** tool returns `{taskId, runs: [{runId, testcaseId, testcaseName}, ...]}`

#### Scenario: Run empty group returns error
- **WHEN** group has no test cases in tree
- **THEN** tool returns error "No test cases found in group"

### Requirement: MCP tool get_run_status returns current execution status
The system SHALL provide `get_run_status` tool that returns the current status of a test run.

#### Scenario: Get run status returns status enum
- **WHEN** client calls `get_run_status` with `{runId: "run_123"}`
- **THEN** tool returns `{runId, status: "pending" | "running" | "passed" | "failed" | "error", startedAt, finishedAt}`

### Requirement: MCP tool get_run_result returns complete execution details
The system SHALL provide `get_run_result` tool that returns full run details including steps, logs, screenshots, and token usage.

#### Scenario: Get run result includes all data
- **WHEN** client calls `get_run_result` with `{runId}`
- **THEN** response includes:
  - `runId`, `testcaseId`, `status`, `startedAt`, `finishedAt`
  - `finalResult`, `finalReason`, `failureSummary`
  - `totalPromptTokens`, `totalCompletionTokens`, `totalTokens`
  - `steps` array with each step: `id`, `stepIdx`, `stepDescription`, `status`, `screenshotUrl`, `logs[]`
  - `testcaseSteps` array with original test case steps for comparison
  - `screenshotFailUrl` if failed

### Requirement: MCP tool cancel_run cancels pending run
The system SHALL provide `cancel_run` tool that marks a pending run as cancelled.

#### Scenario: Cancel pending run
- **WHEN** client calls `cancel_run` with `{runId}` for pending run
- **THEN** run status set to `failed`, `finalResult: "FAIL"`, `finalReason: "Cancelled by user"`
- **THEN** task progress updated

#### Scenario: Cancel running run returns error
- **WHEN** client calls `cancel_run` for run with status `running`
- **THEN** tool returns error "Can only cancel pending runs"

### Requirement: MCP resource e2e://runs/{runId} provides run data
The system SHALL expose run data as an MCP resource for read-only access.

#### Scenario: Read run resource returns JSON
- **WHEN** client reads `e2e://runs/run_123`
- **THEN** resource returns same data as `get_run_result` tool

### Requirement: MCP resource e2e://runs/{runId}/steps/{stepId}/screenshot provides step screenshot
The system SHALL expose step screenshots as binary image resources.

#### Scenario: Read screenshot resource returns PNG
- **WHEN** client reads `e2e://runs/run_123/steps/step_456/screenshot`
- **THEN** resource returns `{contents: [{uri, blob: "base64...", mimeType: "image/png"}]}`
- **THEN** screenshot only available for completed (passed/failed) steps

### Requirement: MCP resource e2e://runs/{runId}/network-log provides network trace
The system SHALL expose network logs as JSON resource.

#### Scenario: Read network log resource
- **WHEN** client reads `e2e://runs/run_123/network-log`
- **THEN** resource returns array of network requests with `url`, `method`, `status`, `timing`, `requestHeaders`, `responseHeaders`

### Requirement: MCP resource e2e://runs/{runId}/console-log provides browser console
The system SHALL expose browser console logs as JSON resource.

#### Scenario: Read console log resource
- **WHEN** client reads `e2e://runs/run_123/console-log`
- **THEN** resource returns array of console entries with `type` (log/error/warn/info), `text`, `timestamp`, `location`