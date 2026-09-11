import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "react-router-dom";

import { FormBlock, FormField } from "@/components/custom/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/custom/BaseDialog";
import { Loader2, ShieldAlert, Trash2, Bot } from "lucide-react";
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
  sendFailureScreenshot: z.boolean(),
  enableReplay: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const aiConfigSchema = z.object({
  executorModelId: z.string().optional(),
  reportModelId: z.string().optional(),
});

type AiConfigFormData = z.infer<typeof aiConfigSchema>;

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  model: string;
}

export default function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const [settings, setSettings] = useState<SettingsFormData | null>(null);
  const [aiConfig, setAiConfig] = useState<AiConfigFormData | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);

  const fetchSettings = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const [settingsRes, modelsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/models"),
      ]);
      if (!settingsRes.ok) throw new Error("無法載入設定");
      const data = await settingsRes.json();
      if (modelsRes.ok) {
        setModels(await modelsRes.json());
      }
      setSettings({
        headless: data.headless,
        slowMo: Number(data.slowMo),
        defaultTimeout: Number(data.defaultTimeout),
        viewportWidth: Number(data.viewportWidth),
        viewportHeight: Number(data.viewportHeight),
        sendFailureScreenshot: data.sendFailureScreenshot ?? true,
        enableReplay: data.enableReplay ?? true,
      });
      // 載入 aiConfig
      const ai = data.aiConfig ?? {};
      setAiConfig({
        executorModelId: ai.executorModelId ?? "",
        reportModelId: ai.reportModelId ?? "",
      });
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
        body: JSON.stringify({
          headless: data.headless,
          slowMo: data.slowMo,
          defaultTimeout: data.defaultTimeout,
          viewportWidth: data.viewportWidth,
          viewportHeight: data.viewportHeight,
          sendFailureScreenshot: data.sendFailureScreenshot,
          enableReplay: data.enableReplay,
        }),
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
        body: JSON.stringify({
          aiConfig: {
            executorModelId: data.executorModelId || undefined,
            reportModelId: data.reportModelId || undefined,
          },
        }),
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

            <div className="sm:col-span-2">
              <FormField
                name="sendFailureScreenshot"
                label="傳送失敗截圖給報告模型"
                description="若報告模型不支援多模態（非視覺模型），請關閉此項"
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
            <div className="sm:col-span-2">
              <FormField
                name="enableReplay"
                label="啟用歷史軌跡重放 (Replay Mode)"
                description="當開啟時，若相同測試案例版本先前已有成功紀錄，將優先重放歷史工具操作，降低 Token 成本並加速執行；重放失敗時自動無縫交棒給 LLM 修復"
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
          </div>
        </FormBlock>

        <Separator className="my-10" />

        {/* 區塊二：AI 模型配置 */}
        <FormBlock
          label="AI 模型配置"
          description="選擇執行器與報告器角色所使用的模型（請先到模型管理頁面建立模型設定）。"
          formSchema={aiConfigSchema}
          defaultValues={aiConfig}
          onSubmit={handleSaveAiConfig}
          submitText={savingAi ? "儲存中..." : "儲存設定"}
        >
          <div className="space-y-6">
            {models.length === 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-950/30 border border-amber-800/40 rounded-md p-3">
                <Bot size={16} />
                尚無模型設定，請先到{" "}
                <Link
                  to="/models"
                  className="underline text-amber-300 hover:text-amber-100"
                >
                  模型管理
                </Link>{" "}
                頁面新增模型。
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                name="executorModelId"
                label="執行器模型 *"
                description="負責逐步瀏覽器操作決策的模型，未設定時無法執行測試"
              >
                {(field, id) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue placeholder="選擇執行器模型…" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                          <span className="ml-2 text-xs text-zinc-400">
                            {m.model}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField
                name="reportModelId"
                label="報告器模型（選填）"
                description="負責生成失敗總結的模型，未設定則跳過報告生成"
              >
                {(field, id) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id={id}>
                      <SelectValue placeholder="選擇報告器模型…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不設定（跳過報告）</SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                          <span className="ml-2 text-xs text-zinc-400">
                            {m.model}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </div>
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
