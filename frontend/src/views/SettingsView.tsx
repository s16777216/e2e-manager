import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { FormBlock, FormField } from "@/components/custom/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/custom/BaseDialog";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import Typography from "@/components/custom/Typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const settingsSchema = z.object({
  headless: z.boolean(),
  slowMo: z.coerce
    .number()
    .min(0, "動作延遲不能為負數")
    .max(3000, "動作延遲不能超過 3000ms"),
  defaultTimeout: z.coerce.number().min(1000, "超時時間至少需 1000ms"),
  viewportWidth: z.coerce
    .number()
    .min(320, "寬度至少為 320")
    .max(3840, "寬度最大為 3840"),
  viewportHeight: z.coerce
    .number()
    .min(240, "高度至少為 240")
    .max(2160, "高度最大為 2160"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const aiConfigSchema = z
  .object({
    executorProvider: z.string().min(1, "請選擇執行器模型提供者"),
    apiKey: z.string().optional(),
    geminiModel: z.string().optional(),
    openaiApiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    openaiModel: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // 1. Google 供應商啟用時，金鑰與模型名稱必填
    const hasGoogle = val.executorProvider === "google";
    if (hasGoogle && (!val.apiKey || val.apiKey.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "啟用 Gemini 供應商時，Gemini API 金鑰為必填",
        path: ["apiKey"],
      });
    }

    if (
      val.executorProvider === "google" &&
      (!val.geminiModel || val.geminiModel.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "執行器選用 Gemini 時，Gemini Executor 模型名稱為必填",
        path: ["geminiModel"],
      });
    }

    // 2. OpenAI 供應商啟用時，金鑰、Base URL 與模型名稱必填
    const hasOpenAi = val.executorProvider === "openai";
    if (hasOpenAi) {
      if (!val.baseUrl || val.baseUrl.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "啟用 OpenAI 供應商時，OpenAI Base URL 為必填",
          path: ["baseUrl"],
        });
      }
      if (!val.openaiApiKey || val.openaiApiKey.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "啟用 OpenAI 供應商時，OpenAI API 金鑰為必填",
          path: ["openaiApiKey"],
        });
      }
    }

    if (
      val.executorProvider === "openai" &&
      (!val.openaiModel || val.openaiModel.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "執行器選用 OpenAI 時，OpenAI 執行器模型名稱為必填",
        path: ["openaiModel"],
      });
    }
  });

type AiConfigFormData = z.infer<typeof aiConfigSchema>;

const DEFAULT_AI_CONFIG: AiConfigFormData = {
  executorProvider: "",
  apiKey: "",
  geminiModel: "",
  openaiApiKey: "",
  baseUrl: "",
  openaiModel: "",
};

export default function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const [settings, setSettings] = useState<SettingsFormData | null>(null);
  const [aiConfig, setAiConfig] = useState<AiConfigFormData | null>(null);
  const [executorProvider, setExecutorProvider] = useState<string>("google");

  const fetchSettings = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("無法載入設定");
      const data = await res.json();
      setSettings({
        headless: data.headless,
        slowMo: Number(data.slowMo),
        defaultTimeout: Number(data.defaultTimeout),
        viewportWidth: Number(data.viewportWidth),
        viewportHeight: Number(data.viewportHeight),
      });
      // 載入 aiConfig（若 DB 有值則用，否則用預設值）
      const ai = data.aiConfig ?? {};
      const execP = ai.executorProvider ?? ai.provider ?? "google";
      setAiConfig({
        executorProvider: execP,
        apiKey: ai.apiKey ?? DEFAULT_AI_CONFIG.apiKey,
        geminiModel: ai.geminiModel ?? DEFAULT_AI_CONFIG.geminiModel,
        openaiApiKey: ai.openaiApiKey ?? DEFAULT_AI_CONFIG.openaiApiKey,
        baseUrl: ai.baseUrl ?? DEFAULT_AI_CONFIG.baseUrl,
        openaiModel: ai.openaiModel ?? DEFAULT_AI_CONFIG.openaiModel,
      });
      setExecutorProvider(execP);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "載入設定失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSettings();
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSave = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("無法儲存設定");
      toast.success("設定儲存成功");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "儲存設定失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiConfig = async (data: AiConfigFormData) => {
    setSavingAi(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiConfig: data }),
      });
      if (!res.ok) throw new Error("無法儲存 AI 模型配置");
      toast.success("AI 模型配置已儲存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "儲存 AI 模型配置失敗");
    } finally {
      setSavingAi(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/settings/history", { method: "DELETE" });
      if (!res.ok) throw new Error("無法清除歷史紀錄");
      toast.success("歷史紀錄已成功清除");
      setShowClearDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "清除歷史紀錄失敗");
    } finally {
      setClearing(false);
    }
  };

  if (loading || !settings || !aiConfig) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        載入全域設定中...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 p-8 select-none">
      <h1 className="text-2xl font-bold tracking-tight mb-8">系統全域設定</h1>

      <div className="mx-auto w-full space-y-10">
        {/* 區塊一：瀏覽器與執行參數 */}
        <FormBlock
          label="瀏覽器與執行參數"
          description="設定測試執行時的無頭模式、動作延遲、超時時間，以及瀏覽器的視窗尺寸。"
          formSchema={settingsSchema}
          defaultValues={settings}
          onSubmit={handleSave}
          submitText={saving ? "儲存中..." : "儲存設定"}
          submitIcon="save"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                name="headless"
                label="Headless 無頭模式"
                description="啟用時會在背景執行，停用時會彈出實體 Chrome 視窗"
              >
                {(field, id) => (
                  <div className="flex items-center mt-2">
                    <Switch
                      id={id}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              </FormField>
            </div>

            <FormField
              name="slowMo"
              label="SlowMo 動作延遲 (毫秒)"
              description="限制上限 3000ms，以防測試超時"
            >
              <Input type="number" placeholder="每個步驟之間的延遲毫秒數" />
            </FormField>

            <FormField
              name="defaultTimeout"
              label="預設等待超時 (毫秒)"
              description="Playwright 操作等待超時"
            >
              <Input type="number" placeholder="Playwright 操作等待超時" />
            </FormField>

            <FormField
              name="viewportWidth"
              label="視窗寬度 (Width)"
              description="限制範圍 320 ~ 3840"
            >
              <Input type="number" placeholder="例如 1280" />
            </FormField>

            <FormField
              name="viewportHeight"
              label="視窗高度 (Height)"
              description="限制範圍 240 ~ 2160"
            >
              <Input type="number" placeholder="例如 800" />
            </FormField>
          </div>
        </FormBlock>

        <Separator className="my-10" />

        {/* 區塊二：AI 模型配置 */}
        <FormBlock
          label="AI 模型配置"
          description="設定 E2E 測試執行引擎所使用的 LLM 供應商、API 金鑰與模型名稱。執行器負責逐步瀏覽器操作決策；斷言器負責視覺截圖判定。"
          formSchema={aiConfigSchema}
          defaultValues={aiConfig}
          onSubmit={handleSaveAiConfig}
          submitText={savingAi ? "儲存中..." : "儲存設定"}
        >
          <div className="space-y-8">
            {/* 執行器配置區 */}
            <div className="space-y-4">
              <Typography type="h6" className="text-zinc-300 font-medium">
                執行器配置 (Executor)
              </Typography>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  name="executorProvider"
                  label="執行器供應商"
                  description="決定執行器模型所使用的 AI 供應商"
                >
                  {(field, id) => (
                    <Select
                      value={field.value}
                      onValueChange={(value: string) => {
                        field.onChange(value);
                        setExecutorProvider(value);
                      }}
                    >
                      <SelectTrigger id={id}>
                        <SelectValue placeholder="選擇供應商" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Gemini</SelectItem>
                        <SelectItem value="openai">
                          OpenAI Compatible
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                {executorProvider === "google" ? (
                  <FormField
                    name="geminiModel"
                    label="Gemini Executor 模型"
                    description="執行器使用的 Gemini 模型名稱"
                  >
                    <Input placeholder="例如 gemini-2.0-flash" />
                  </FormField>
                ) : (
                  <FormField
                    name="openaiModel"
                    label="OpenAI 執行器模型"
                    description="須支援 Vision 與 Tool Calling"
                  >
                    <Input placeholder="例如 gpt-4o 或 llama3.2-vision" />
                  </FormField>
                )}
              </div>
            </div>

            {/* API 連線憑證區 */}
            {(executorProvider === "google" ||
              executorProvider === "openai") && (
              <>
                <Separator className="bg-zinc-800" />
                <div className="space-y-4">
                  <Typography type="h6" className="text-zinc-300 font-medium">
                    API 連線憑證配置
                  </Typography>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {(executorProvider === "google") && (
                      <div className="sm:col-span-2">
                        <FormField
                          name="apiKey"
                          label="Gemini API 金鑰"
                          description="Google AI Studio 的 API Key"
                        >
                          <Input type="password" placeholder="AIzaSy..." />
                        </FormField>
                      </div>
                    )}

                    {(executorProvider === "openai") && (
                      <>
                        <div className="sm:col-span-2">
                          <FormField
                            name="baseUrl"
                            label="OpenAI Base URL"
                            description="OpenAI Compatible API 的基礎網址"
                          >
                            <Input placeholder="http://localhost:11434/v1" />
                          </FormField>
                        </div>

                        <div className="sm:col-span-2">
                          <FormField
                            name="openaiApiKey"
                            label="OpenAI API 金鑰"
                            description="OpenAI 或相容服務的 API Key（本地 Ollama 可填 ollama）"
                          >
                            <Input
                              type="password"
                              placeholder="sk-... 或 ollama"
                            />
                          </FormField>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </FormBlock>

        <Separator className="my-10" />

        {/* 危險區域 */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col space-y-1">
            <h3 className="font-semibold text-lg text-red-400">危險區域</h3>
            <p className="text-muted-foreground text-sm">
              此處的操作具備破壞性且不可逆，請謹慎執行。
            </p>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="border-red-900/30 bg-red-950/10">
              <CardContent>
                <div className="flex justify-between gap-4 max-lg:flex-col lg:items-center">
                  <div className="space-y-1">
                    <Typography type="h6" className="text-red-400">
                      清除歷史紀錄
                    </Typography>
                    <Typography type="p" className="text-zinc-400">
                      一鍵清除資料庫中的所有測試執行歷史、步驟截圖與日誌。
                    </Typography>
                  </div>
                  <Button
                    id="clear-history-btn"
                    type="button"
                    variant="destructive"
                    onClick={() => setShowClearDialog(true)}
                    className="bg-red-950/40 border border-red-800/60 hover:bg-red-900 hover:text-white cursor-pointer"
                  >
                    <Trash2 size={16} className="mr-2" />
                    清除歷史紀錄
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BaseDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title={
          <span className="text-red-400 flex items-center gap-2">
            <ShieldAlert size={20} /> 清除所有執行歷史紀錄
          </span>
        }
        description="此操作是不可逆的破壞性變更。"
        height="220px"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100 cursor-pointer"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              disabled={clearing}
              className="cursor-pointer"
            >
              {clearing ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              確定清除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-zinc-300 py-2">
          您確定要刪除資料庫中的所有測試運行紀錄（TestRun）、步驟明細與截圖資料嗎？這將會清空所有歷史資料。
        </p>
      </BaseDialog>
    </div>
  );
}
