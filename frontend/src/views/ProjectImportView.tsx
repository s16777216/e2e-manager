import React, { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DataTable } from "@/components/custom/table/DataTable";
import { StepperContent, type StepDefinition } from "@/components/ui/stepper";
import { Stepper08 } from "@/components/shadcn-studio/stepper/stepper-08";
import type { ColumnDef, ExpandedState } from "@tanstack/react-table";
import { 
  ChevronRight, 
  ChevronDown, 
  FolderOpen, 
  FileText, 
  File, 
  Loader2,
} from "lucide-react";
import ProjectFormGeneralBlock from "@/features/projects/components/ProjectFormGeneralBlock";
import {
  generalFormSchema,
  promptFormSchema,
  schema,
  storageFormSchema,
} from "@/features/projects/schema";
import { Separator } from "@/components/ui/separator";
import ProjectFormPromptBlock from "@/features/projects/components/ProjectFormPromptBlock";
import ProjectFormStorageBlock from "@/features/projects/components/ProjectFormStorageBlock";
import ProjectFormVariableBlock from "@/features/projects/components/ProjectFormVariableBlock";
import z from "zod";
import { useLayout } from "@/layouts/LayoutContext";

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

export interface TreeNode {
  tempId: string;
  name: string;
  type: "group" | "testcase";
  checked: boolean;
  indeterminate?: boolean;
  children?: TreeNode[];
  groupData?: {
    systemPrompt?: string;
    disableParentPrompt?: boolean;
    initCookies?: Record<string, unknown>;
    initLocalStorage?: Record<string, unknown>;
    variables?: Record<string, unknown>;
  };
  testcaseData?: ExportTestcasePayload;
}

interface ImportConfirmPayload {
  projectName: string;
  description?: string;
  systemPrompt?: string;
  initCookies?: Record<string, unknown>;
  initLocalStorage?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  selectedTree: ExportGroupPayload[];
}

const importSteps: StepDefinition[] = [
  {
    id: "upload",
    title: "1. 選擇 JSON 檔案",
    description: "選擇上傳導出的專案 JSON 備份檔",
  },
  {
    id: "settings",
    title: "2. 確認專案設定",
    description: "自訂新專案名稱與說明",
  },
  {
    id: "tree-selection",
    title: "3. 選擇測試案例",
    description: "核對群組與測試案例",
  },
];

const ProjectImportView = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [currentStep, setCurrentStep] = useState("upload");
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // We initialize the formState with values from activeProject.
  const [formState, setFormState] = useState<z.infer<typeof schema>>({
    name: "",
    description: "",
    systemPrompt: "",
    initCookies: "",
    initLocalStorage: "",
    variables: {},
  });

  const processTreeForCheckboxes = (groups: ExportGroupPayload[]): TreeNode[] => {
    let tempIdCounter = 0;
    const process = (items: ExportGroupPayload[]): TreeNode[] => {
      return items.map((g) => {
        const tempId = g.tempId || `temp_${++tempIdCounter}`;
        const children = g.children ? process(g.children) : undefined;
        const testcases = g.testcases
          ? g.testcases.map((tc) => ({
              tempId: tc.name ? `tc_${tc.name}_${++tempIdCounter}` : `temp_${++tempIdCounter}`,
              name: tc.name,
              type: "testcase" as const,
              checked: true,
              testcaseData: tc,
            }))
          : undefined;
        return {
          tempId,
          name: g.name,
          type: "group" as const,
          checked: true,
          children: [...(children || []), ...(testcases || [])],
          groupData: {
            systemPrompt: g.systemPrompt,
            disableParentPrompt: g.disableParentPrompt,
            initCookies: g.initCookies,
            initLocalStorage: g.initLocalStorage,
            variables: g.variables,
          },
        };
      });
    };
    return process(groups);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".json")) {
      toast.error("請選擇 JSON 檔案");
      return;
    }
    setFile(selectedFile);
    setTreeData([]);
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleBeforeNext = useCallback(async (): Promise<boolean> => {
    if (currentStep === "upload") {
      if (!file) {
        toast.error("請先選擇 JSON 檔案");
        return false;
      }

      setIsParsing(true);
      try {
        const data = await api.previewImportProject(file);
        setFormState({
          name: data.suggestedName || data.project?.name || "",
          description: data.project?.description || "",
          systemPrompt: data.project?.systemPrompt || undefined,
          initCookies: JSON.stringify(data.project?.initCookies || {}),
          initLocalStorage: JSON.stringify(
            data.project?.initLocalStorage || {},
          ),
          variables: (data.project?.variables as Record<string, { value: string; description?: string }>) || undefined,
        });
        if (data.previewTree) {
          const processedTree = processTreeForCheckboxes(data.previewTree);
          setTreeData(processedTree);
        }
        toast.success("檔案內容解析成功！");
        return true;
      } catch (error) {
        toast.error("檔案解析失敗或格式錯誤");
        console.error(error);
        return false;
      } finally {
        setIsParsing(false);
      }
    }
    return true;
  }, [currentStep, file]);

  const columns: ColumnDef<TreeNode>[] = [
    {
      accessorKey: "name",
      header: "名稱",
      cell: ({ row }) => {
        const node = row.original;
        const canExpand = row.getCanExpand();
        const isExpanded = row.getIsExpanded();
        return (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${row.depth * 20}px` }}
          >
            {canExpand ? (
              <button
                onClick={row.getToggleExpandedHandler()}
                className="p-1 text-zinc-400 hover:text-zinc-100"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {node.type === "group" ? (
              <FolderOpen className="text-amber-400" size={16} />
            ) : (
              <FileText className="text-zinc-400" size={16} />
            )}
            <span className="font-medium text-zinc-100">{node.name}</span>
          </div>
        );
      },
    },
  ];

  const handleImport = useCallback(async () => {
    if (!file || treeData.length === 0) return;
    setIsImporting(true);
    try {
      const selectedTree = treeData
        .map((node) => {
          const filterSelected = (n: TreeNode): ExportGroupPayload | null => {
            if (!n.checked) return null;

            const groupChildren: ExportGroupPayload[] = [];
            const groupTestcases: ExportTestcasePayload[] = [];

            if (n.children) {
              for (const child of n.children) {
                if (!child.checked) continue;
                if (child.type === "testcase" && child.testcaseData) {
                  groupTestcases.push(child.testcaseData);
                } else if (child.type === "group") {
                  const processedGroup = filterSelected(child);
                  if (processedGroup) {
                    groupChildren.push(processedGroup);
                  }
                }
              }
            }

            return {
              name: n.name,
              systemPrompt: n.groupData?.systemPrompt,
              disableParentPrompt: n.groupData?.disableParentPrompt,
              initCookies: n.groupData?.initCookies,
              initLocalStorage: n.groupData?.initLocalStorage,
              variables: n.groupData?.variables,
              children: groupChildren.length > 0 ? groupChildren : undefined,
              testcases: groupTestcases.length > 0 ? groupTestcases : undefined,
            };
          };
          return filterSelected(node);
        })
        .filter((n): n is ExportGroupPayload => n !== null);

      if (selectedTree.length === 0) {
        toast.error("請至少選擇一個項目");
        return;
      }

      const payload: ImportConfirmPayload = {
        projectName: formState.name,
        description: formState.description,
        systemPrompt: formState.systemPrompt,
        initCookies: JSON.parse(formState.initCookies || "{}"),
        initLocalStorage: JSON.parse(formState.initLocalStorage || "{}"),
        variables: formState.variables,
        selectedTree,
      };

      const result = await api.confirmImportProject(payload);
      toast.success("專案匯入成功！");
      navigate(`/project/${result.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "匯入失敗");
    } finally {
      setIsImporting(false);
    }
  }, [file, treeData, formState, navigate]);

  // Determine if next is disabled for current step
  const isNextDisabled =
    currentStep === "upload"
      ? !file || isParsing
      : currentStep === "settings"
        ? !formState.name.trim()
        : isImporting || treeData.length === 0;

  const layout = useLayout();

  useEffect(() => {
    layout.scroll({
      top: 0,
      behavior: "smooth",
    });
  }, [currentStep, layout]);

  return (
    <div className="p-6">
      <div className="mx-auto space-y-6">
        {/* Stepper Wizard Container */}
        <Stepper08
          steps={importSteps}
          value={currentStep}
          onValueChange={setCurrentStep}
          onBeforeNext={handleBeforeNext}
          onComplete={handleImport}
          isNextDisabled={isNextDisabled}
          nextText={isParsing ? "解析中..." : "下一步"}
          completeText={isImporting ? "匯入中..." : "匯入專案"}
        >
          {/* Step 1 Content */}
          <StepperContent value="upload">
            <div
              className="h-full border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors text-center border-zinc-700 hover:border-zinc-500 flex item-center justify-center flex-col"
              onClick={() =>
                document.getElementById("import-file-input")?.click()
              }
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                id="import-file-input"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              {isParsing ? (
                <Loader2 className="mx-auto h-12 w-12 text-amber-500 animate-spin mb-3" />
              ) : (
                <File className="mx-auto h-12 w-12 text-zinc-400 mb-3" />
              )}

              {file ? (
                <>
                  <p className="font-medium text-base">{file.name}</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-zinc-200 font-medium mb-1 text-base">
                    點擊或拖曳上傳 JSON 備份檔案
                  </p>
                  <p className="text-zinc-500 text-xs">
                    支援專案規格標準導出格式 (schemaVersion 1.0)
                  </p>
                </>
              )}
            </div>
          </StepperContent>

          {/* Step 2 Content */}
          <StepperContent value="settings">
            <div className="flex-1 mx-auto w-full space-y-10">
              <ProjectFormGeneralBlock
                formSchema={generalFormSchema}
                defaultValues={{
                  name: formState.name,
                  description: formState.description,
                }}
                onChange={(data) =>
                  setFormState((prev) => ({ ...prev, ...data }))
                }
                showSubmitButton={false}
              />
              <Separator className="my-10" />
              <ProjectFormPromptBlock
                formSchema={promptFormSchema}
                defaultValues={{
                  systemPrompt: formState.systemPrompt,
                }}
                onChange={(data) =>
                  setFormState((prev) => ({ ...prev, ...data }))
                }
                showSubmitButton={false}
              />
              <Separator className="my-10" />
              <ProjectFormStorageBlock
                formSchema={storageFormSchema}
                defaultValues={{
                  initCookies: formState.initCookies,
                  initLocalStorage: formState.initLocalStorage,
                }}
                onChange={(data) =>
                  setFormState((prev) => ({ ...prev, ...data }))
                }
                showSubmitButton={false}
              />
              <Separator className="my-10" />
              <ProjectFormVariableBlock
                variables={formState.variables!}
                onChange={(variables) =>
                  setFormState((prev) => ({ ...prev, variables }))
                }
              />
            </div>
          </StepperContent>

          {/* Step 3 Content */}
          <StepperContent value="tree-selection">
            <DataTable
              columns={columns}
              data={treeData}
              getSubRows={(row) => row.children}
              getRowId={(row) => row.tempId}
              searchPlaceholder="搜尋群組或測試案例..."
              expanded={expanded}
              onExpandedChange={setExpanded}
              enableRowSelection
            />
          </StepperContent>
        </Stepper08>
      </div>
    </div>
  );
};

export default ProjectImportView;
