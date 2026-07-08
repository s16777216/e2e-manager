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
  children?: TestGroup[];
  testcases?: Testcase[];
  testcaseCount?: number;
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
  asserterPromptTokens?: number;
  asserterCompletionTokens?: number;
  asserterTotalTokens?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalTokens?: number;
  failureSummary?: string;
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
