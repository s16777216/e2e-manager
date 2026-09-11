import type { Project, TestGroup, Testcase, TestRun, Task, TaskRun, VariableItem, ProjectImportPreviewResponse, DatabaseStorageMetrics } from "../types/api";

const BASE_URL = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const rawHeaders = (options?.headers as Record<string, string>) || {};
  const headers: Record<string, string> = isFormData
    ? { ...rawHeaders }
    : {
        "Content-Type": "application/json",
        ...rawHeaders,
      };

  if (isFormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = "API 請求失敗";
    try {
      const errJson = await res.json();
      errMsg = errJson.error || errMsg;
    } catch {
      // Ignored
    }
    throw new Error(errMsg);
  }

  // 某些 DELETE 路由可能返回空或 204
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

export const api = {
  // Project APIs
  getProjects: () => request<Project[]>("/projects"),
  createProject: (
    name: string,
    description?: string,
    initCookies?: unknown,
    initLocalStorage?: unknown,
    variables?: Record<string, VariableItem>,
    systemPrompt?: string,
  ) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description, initCookies, initLocalStorage, variables, systemPrompt }),
    }),
  updateProject: (
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      systemPrompt?: string | null;
      initCookies?: unknown;
      initLocalStorage?: unknown;
      variables?: Record<string, VariableItem> | null;
    },
  ) =>
    request<Project>(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteProject: (projectId: string) =>
    request<{ message: string }>(`/projects/${projectId}`, {
      method: "DELETE",
    }),

  // Group APIs
  getGroups: (projectId: string) =>
    request<TestGroup[]>(`/projects/${projectId}/groups`),
  createGroup: (
    projectId: string,
    name: string,
    parentId?: string | null,
    initCookies?: unknown,
    initLocalStorage?: unknown,
    variables?: Record<string, VariableItem>,
    systemPrompt?: string,
    disableParentPrompt?: boolean,
  ) =>
    request<TestGroup>(`/projects/${projectId}/groups`, {
      method: "POST",
      body: JSON.stringify({ name, parentId, initCookies, initLocalStorage, variables, systemPrompt, disableParentPrompt }),
    }),
  updateGroup: (
    groupId: string,
    data: {
      name?: string;
      parentId?: string | null;
      systemPrompt?: string | null;
      disableParentPrompt?: boolean | null;
      initCookies?: unknown;
      initLocalStorage?: unknown;
      variables?: Record<string, VariableItem> | null;
    },
  ) =>
    request<TestGroup>(`/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteGroup: (groupId: string) =>
    request<{ message: string }>(`/groups/${groupId}`, {
      method: "DELETE",
    }),

  // Testcase APIs
  getTestcases: (groupId: string) =>
    request<Testcase[]>(`/groups/${groupId}/testcases`),
  createTestcase: (
    groupId: string,
    data: {
      name: string;
      steps: Array<{ action: string; expected?: string; hasExpected: boolean }>;
      expected: string;
      systemPrompt?: string | null;
      disableParentPrompt?: boolean | null;
      initCookies?: unknown;
      initLocalStorage?: unknown;
      variables?: Record<string, VariableItem> | null;
    },
  ) =>
    request<Testcase>(`/groups/${groupId}/testcases`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTestcase: (
    testcaseId: string,
    data: {
      name?: string;
      steps?: Array<{ action: string; expected?: string; hasExpected: boolean }>;
      expected?: string;
      systemPrompt?: string | null;
      disableParentPrompt?: boolean | null;
      initCookies?: unknown;
      initLocalStorage?: unknown;
      variables?: Record<string, VariableItem> | null;
    },
  ) =>
    request<Testcase>(`/testcases/${testcaseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTestcase: (testcaseId: string) =>
    request<{ message: string }>(`/testcases/${testcaseId}`, {
      method: "DELETE",
    }),
  getTestcaseDetail: (testcaseId: string) =>
    request<Testcase>(`/testcases/${testcaseId}`),

  // Run APIs
  triggerRun: (testcaseId: string) =>
    request<{ taskId: string; runs: TaskRun[] }>(
      `/testcases/${testcaseId}/run`,
      { method: "POST" },
    ),
  runProject: (projectId: string) =>
    request<{
      taskId: string;
      runs: TaskRun[];
    }>(`/projects/${projectId}/run`, { method: "POST" }),
  runGroup: (groupId: string) =>
    request<{
      taskId: string;
      runs: TaskRun[];
    }>(`/groups/${groupId}/run`, { method: "POST" }),
  getRunStatus: (runId: string) => request<TestRun>(`/runs/${runId}`),
  cancelRun: (runId: string) =>
    request<{ message: string }>(`/runs/${runId}`, { method: "DELETE" }),

  // Task APIs
  getTask: (taskId: string) => request<Task>(`/tasks/${taskId}`),
  getTaskStreamUrl: (taskId: string) => `${BASE_URL}/tasks/${taskId}/stream`,
  getProjectTasks: (projectId: string) => request<Task[]>(`/projects/${projectId}/tasks`),
  getAllTasks: () => request<Task[]>("/tasks"),

  // SSE Stream URL helper
  getStreamUrl: (runId: string) => `${BASE_URL}/runs/${runId}/stream`,

  // Export/Import APIs
  exportProject: (projectId: string) => `${BASE_URL}/projects/${projectId}/export`,
  previewImportProject: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ProjectImportPreviewResponse>("/projects/import/preview", {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
  confirmImportProject: (payload: unknown) =>
    request<{ id: string; name: string }>("/projects/import", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getStorageMetrics: () => request<DatabaseStorageMetrics>("/settings/storage"),
};
