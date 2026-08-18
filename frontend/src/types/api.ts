export type CookiesData = Record<string, Record<string, unknown>>;
export type LocalStorageData = Record<string, unknown>;

export interface VariableItem {
  value: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string | null;
  createdAt: string;
  testcaseCount?: number;
  groups?: TestGroup[];
  initCookies?: CookiesData | null;
  initLocalStorage?: LocalStorageData | null;
  variables?: Record<string, VariableItem> | null;
}

export interface TestGroup {
  id: string;
  name: string;
  parent?: TestGroup | null;
  parentId?: string | null;
  project?: Project | null;
  children?: TestGroup[];
  testcases?: Testcase[];
  testcaseCount?: number;
  systemPrompt?: string | null;
  disableParentPrompt?: boolean | null;
  initCookies?: CookiesData | null;
  initLocalStorage?: LocalStorageData | null;
  variables?: Record<string, VariableItem> | null;
}

export interface TestcaseStep {
  id: string;
  stepIdx: number;
  action: string;
  expected?: string;
  hasExpected: boolean;
}

export interface Testcase {
  id: string;
  name: string;
  steps: TestcaseStep[];
  expected: string;
  createdAt: string;
  group?: TestGroup;
  runs?: TestRun[];
  systemPrompt?: string | null;
  disableParentPrompt?: boolean | null;
  initCookies?: CookiesData | null;
  initLocalStorage?: LocalStorageData | null;
  variables?: Record<string, VariableItem> | null;
}

export interface TestRun {
  id: string;
  testcaseId?: string | null;
  status: "pending" | "running" | "passed" | "failed" | "error";
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  finalResult?: string;
  finalReason?: string;
  screenshotFailUrl?: string;
  steps?: TestRunStep[];
  testcaseSteps?: TestcaseStep[];
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalTokens?: number;
  failureSummary?: {
    reason: string;
    suggestion: string;
  };
}

export interface TestRunStep {
  id: string;
  stepIdx: number;
  stepDescription: string;
  status: "pending" | "running" | "passed" | "failed" | "error" | "skipped";
  screenshotUrl?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  logs?: TestLog[];
}

export interface TestLog {
  id: string;
  action: string;
  result: string;
  aiResponse?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface TaskRun {
  runId: string;
  testcaseId: string | null;
  testcaseName: string;
  status: "pending" | "running" | "passed" | "failed" | "error";
}

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
}

export interface SystemSettings {
  id: string;
  headless: boolean;
  viewportWidth: number;
  viewportHeight: number;
  slowMo: number;
  defaultTimeout: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportTestcasePayload {
  name: string;
  expected: string;
  systemPrompt?: string;
  disableParentPrompt?: boolean;
  initCookies?: Record<string, unknown>;
  initLocalStorage?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  steps: Array<{
    stepIndex: number;
    action: string;
    target: string;
    value?: string;
  }>;
}

export interface ExportGroupPayload {
  tempId?: string;
  name: string;
  systemPrompt?: string;
  disableParentPrompt?: boolean;
  initCookies?: Record<string, unknown>;
  initLocalStorage?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  children?: ExportGroupPayload[];
  testcases?: ExportTestcasePayload[];
}

export interface ProjectImportPreviewResponse {
  suggestedName?: string;
  project?: {
    name?: string;
    description?: string;
    systemPrompt?: string | null;
    initCookies?: Record<string, unknown> | null;
    initLocalStorage?: Record<string, unknown> | null;
    variables?: Record<string, unknown> | null;
  };
  previewTree?: ExportGroupPayload[];
}
