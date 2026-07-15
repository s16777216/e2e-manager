import { useState } from "react";
import {
  useNavigate,
  useRouteLoaderData,
  useRevalidator,
} from "react-router-dom";
import { useProjectData } from "../hooks/useProjectData";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import z from "zod";
import type {
  CookiesData,
  LocalStorageData,
  Project,
  VariableItem,
} from "@/types/api";
import {
  schema,
  generalFormSchema,
  promptFormSchema,
  storageFormSchema,
} from "../schema";

import ProjectFormGeneralBlock from "../components/ProjectFormGeneralBlock";
import ProjectFormPromptBlock from "../components/ProjectFormPromptBlock";
import ProjectFormStorageBlock from "../components/ProjectFormStorageBlock";
import ProjectFormVariableBlock from "../components/ProjectFormVariableBlock";
import ProjectFormDangerBlock from "../components/ProjectFormDangerBlock";
import ProjectFormExportBlock from "../components/ProjectFormExportBlock";

export default function ProjectEditView() {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const activeProject = useRouteLoaderData("project-root") as Project | null;
  const { handleUpdateProject, handleDeleteProject } = useProjectData();
  const [isSaving, setIsSaving] = useState(false);

  // We initialize the formState with values from activeProject.
  const [formState, setFormState] = useState<z.infer<typeof schema>>({
    name: activeProject?.name || "",
    description: activeProject?.description || "",
    systemPrompt: activeProject?.systemPrompt || "",
    initCookies: activeProject?.initCookies
      ? JSON.stringify(activeProject.initCookies, null, 2)
      : "",
    initLocalStorage: activeProject?.initLocalStorage
      ? JSON.stringify(activeProject.initLocalStorage, null, 2)
      : "",
    variables: activeProject?.variables || {},
  });

  // If there is no active project, we display the not found message.
  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4">
        <div>找不到指定的專案。</div>
        <button
          onClick={() => navigate("/project")}
          className="text-zinc-100 hover:underline text-sm font-medium"
        >
          返回專案列表
        </button>
      </div>
    );
  }

  const handleGeneralFormSave = async (
    data: z.infer<typeof generalFormSchema>,
  ) => {
    setIsSaving(true);
    try {
      const updateData = {
        ...formState,
        ...data,
      };
      setFormState(updateData);

      await handleUpdateProject(activeProject.id, {
        name: data.name,
        description: data.description || "",
      });
      revalidate();
      toast.success("基本資訊已儲存");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "儲存失敗，請稍後再試";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptFormSave = async (
    data: z.infer<typeof promptFormSchema>,
  ) => {
    setIsSaving(true);
    try {
      const updateData = {
        ...formState,
        ...data,
      };
      setFormState(updateData);

      await handleUpdateProject(activeProject.id, {
        systemPrompt: data.systemPrompt || "",
      });
      revalidate();
      toast.success("前置提示詞已儲存");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "儲存失敗，請稍後再試";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStorageFormSave = async (
    data: z.infer<typeof storageFormSchema>,
  ) => {
    setIsSaving(true);
    try {
      const updateData = {
        ...formState,
        ...data,
      };
      setFormState(updateData);

      const parsedCookies: CookiesData = updateData.initCookies
        ? JSON.parse(updateData.initCookies)
        : {};
      const parsedLocalStorage: LocalStorageData = updateData.initLocalStorage
        ? JSON.parse(updateData.initLocalStorage)
        : {};
      await handleUpdateProject(activeProject.id, {
        initCookies: parsedCookies,
        initLocalStorage: parsedLocalStorage,
      });
      revalidate();
      toast.success("儲存與 Cookies 設定已儲存");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "儲存失敗，請稍後再試";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVariablesChange = async (
    variables: Record<string, VariableItem>,
  ) => {
    setIsSaving(true);
    try {
      const updateData = {
        ...formState,
        variables,
      };
      setFormState(updateData);

      await handleUpdateProject(activeProject.id, {
        variables,
      });
      revalidate();
      toast.success("變數設定已儲存");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "儲存失敗，請稍後再試";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const success = await handleDeleteProject(activeProject.id);
    if (success) {
      navigate("/project");
    }
  };

  return (
    <div className="flex-1 p-8 mx-auto w-full space-y-10">
      <ProjectFormGeneralBlock
        formSchema={generalFormSchema}
        defaultValues={{
          name: formState.name,
          description: formState.description,
        }}
        onSubmit={handleGeneralFormSave}
        submitLabel={isSaving ? "儲存中..." : "儲存修改"}
      />
      <Separator className="my-10" />
      <ProjectFormPromptBlock
        formSchema={promptFormSchema}
        defaultValues={{
          systemPrompt: formState.systemPrompt,
        }}
        onSubmit={handlePromptFormSave}
        submitLabel={isSaving ? "儲存中..." : "儲存修改"}
      />
      <Separator className="my-10" />
      <ProjectFormStorageBlock
        formSchema={storageFormSchema}
        defaultValues={{
          initCookies: formState.initCookies,
          initLocalStorage: formState.initLocalStorage,
        }}
        onSubmit={handleStorageFormSave}
        submitLabel={isSaving ? "儲存中..." : "儲存修改"}
      />
      <Separator className="my-10" />
      <ProjectFormVariableBlock
        variables={formState.variables!}
        onChange={handleVariablesChange}
      />
      <Separator className="my-10" />
      <ProjectFormExportBlock projectId={activeProject.id} />
      <Separator className="my-10" />
      <ProjectFormDangerBlock
        projectName={activeProject.name || ""}
        onProjectDelete={handleDelete}
      />
    </div>
  );
}
