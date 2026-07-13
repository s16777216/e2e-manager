import { useState, useEffect, useCallback, useContext } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BaseDialog } from "@/components/custom/BaseDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FormBlock, FormField } from "@/components/custom/form";
import { FormContext } from "@/components/custom/form/FormContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Bot } from "lucide-react";
import Typography from "@/components/custom/Typography";
import { DataTable } from "@/components/custom/table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModelSetting {
  id: string;
  name: string;
  description: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

const modelSchema = z.object({
  name: z.string().min(1, "顯示名稱為必填"),
  description: z.string().optional(),
  provider: z.enum(["google", "openai"], { required_error: "請選擇供應商" }),
  apiKey: z.string().min(1, "API 金鑰為必填"),
  baseUrl: z.string().optional(),
  model: z.string().min(1, "模型名稱為必填"),
});

type ModelFormData = z.infer<typeof modelSchema>;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google Gemini",
  openai: "OpenAI Compatible",
};

function ModelFields() {
  const form = useContext(FormContext);
  const provider = form?.watch("provider") || "google";

  return (
    <div className="space-y-4">
      <FormField name="name" label="顯示名稱 *">
        <Input
          placeholder="例如 Gemini Flash 執行器"
          className="bg-zinc-800 border-zinc-700"
        />
      </FormField>

      <FormField name="description" label="說明（選填）">
        <Input
          placeholder="用於說明此模型的用途"
          className="bg-zinc-800 border-zinc-700"
        />
      </FormField>

      <FormField name="provider" label="供應商 *">
        {(field, id: string) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={id} className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="選擇供應商" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <SelectItem value="google">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI Compatible</SelectItem>
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField name="apiKey" label="API 金鑰 *">
        <Input
          type="password"
          placeholder={provider === "google" ? "AIzaSy..." : "sk-... 或 ollama"}
          className="bg-zinc-800 border-zinc-700"
        />
      </FormField>

      {provider === "openai" && (
        <FormField
          name="baseUrl"
          label="Base URL"
          description="OpenAI Compatible API 的基礎網址"
        >
          <Input
            placeholder="http://localhost:11434/v1"
            className="bg-zinc-800 border-zinc-700"
          />
        </FormField>
      )}

      <FormField name="model" label="模型名稱 *">
        <Input
          placeholder={provider === "google" ? "gemini-2.0-flash" : "gpt-4o"}
          className="bg-zinc-800 border-zinc-700"
        />
      </FormField>
    </div>
  );
}

export default function ModelManageView() {
  const [models, setModels] = useState<ModelSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelSetting | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<ModelSetting | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchModels = useCallback(async () => {
    fetch("/api/models")
      .then(async (res) => {
        if (!res.ok) throw new Error("無法載入模型列表");
        setModels(await res.json());
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "載入失敗");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const openCreate = () => {
    setEditingModel(null);
    setDrawerOpen(true);
  };

  const openEdit = (model: ModelSetting) => {
    setEditingModel(model);
    setDrawerOpen(true);
  };

  const handleSubmit = async (data: ModelFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        baseUrl: data.provider === "openai" ? (data.baseUrl ?? "") : "",
      };
      let res: Response;
      if (editingModel) {
        res = await fetch(`/api/models/${editingModel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error(editingModel ? "更新失敗" : "新增失敗");
      toast.success(editingModel ? "模型已更新" : "模型已新增");
      setDrawerOpen(false);
      fetchModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失敗");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (model: ModelSetting) => {
    setDeleteTarget(model);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/models/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.status === 409) {
        const body = await res.json();
        setDeleteError(body.error ?? "此模型正在被使用中，無法刪除。");
        return;
      }
      if (!res.ok) throw new Error("刪除失敗");
      toast.success(`已刪除模型「${deleteTarget.name}」`);
      setDeleteTarget(null);
      fetchModels();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  };

  const defaultValues: ModelFormData = editingModel
    ? {
        name: editingModel.name,
        description: editingModel.description ?? "",
        provider: (editingModel.provider as "google" | "openai") || "google",
        apiKey: editingModel.apiKey ?? "",
        baseUrl: editingModel.baseUrl ?? "",
        model: editingModel.model,
      }
    : {
        name: "",
        description: "",
        provider: "google",
        apiKey: "",
        baseUrl: "",
        model: "",
      };

  const columns: ColumnDef<ModelSetting>[] = [
    { accessorKey: "name", header: "名稱" },
    {
      accessorKey: "provider",
      header: "供應商",
      cell: ({ row }) => {
        const provider = row.original.provider;
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              provider === "google"
                ? "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
            }`}
          >
            {PROVIDER_LABELS[provider] ?? provider}
          </span>
        );
      },
    },
    {
      accessorKey: "model",
      header: "模型",
      cell: ({ row }) => {
        return <Typography type="inlineCode">{row.original.model}</Typography>;
      },
    },
    {
      accessorKey: "description",
      header: "說明",
      cell: ({ row }) => {
        return (
          <Typography
            type="p"
            className="text-zinc-500 text-sm max-w-[200px] truncate"
          >
            {row.original.description || "—"}
          </Typography>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row.original)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDelete(row.original)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 p-8 select-none">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bot size={28} />
          <Typography type="h3">模型管理</Typography>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          新增模型
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 text-zinc-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          載入中...
        </div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-4">
          <Bot size={48} className="text-zinc-700" />
          <Typography type="p">
            尚無模型設定，點擊右上角「新增模型」開始建立。
          </Typography>
        </div>
      ) : (
        <DataTable columns={columns} data={models}></DataTable>
      )}

      {/* 新增 / 編輯 Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right">
          <ScrollArea className="w-full h-full">
            {drawerOpen && (
              <FormBlock
                key={editingModel ? editingModel.id : "new-model"}
                label={editingModel ? "編輯模型設定" : "新增模型設定"}
                description=""
                layout="vertical"
                formSchema={modelSchema}
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                submitText={
                  saving ? "處理中..." : editingModel ? "儲存變更" : "新增模型"
                }
                submitIcon="save"
                footerFront={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDrawerOpen(false)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 cursor-pointer mr-3"
                  >
                    取消
                  </Button>
                }
                className="w-full"
              >
                <ModelFields />
              </FormBlock>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 刪除確認 Dialog */}
      <BaseDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="刪除模型設定"
        description="此操作無法復原。"
        height="220px"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100 cursor-pointer"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting && <Loader2 className="animate-spin mr-2" size={16} />}
              確定刪除
            </Button>
          </div>
        }
      >
        {deleteError ? (
          <div className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-md p-3 mt-2">
            {deleteError}
          </div>
        ) : (
          <p className="text-sm text-zinc-300 py-2">
            確定要刪除模型「
            <span className="font-semibold text-zinc-100">
              {deleteTarget?.name}
            </span>
            」嗎？
          </p>
        )}
      </BaseDialog>
    </div>
  );
}
