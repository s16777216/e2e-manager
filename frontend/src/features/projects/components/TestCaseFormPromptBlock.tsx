import { useState } from "react";
import { FormBlock, FormField } from "@/components/custom/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import z from "zod";

const testCasePromptFormSchema = z.object({
  systemPrompt: z.string().optional(),
  disableParentPrompt: z.boolean().optional(),
});

type TestCasePromptFormValues = z.infer<typeof testCasePromptFormSchema>;

export interface ParentPromptInfo {
  projectPrompt?: string | null;
  groupsPrompts?: Array<{
    name: string;
    systemPrompt?: string | null;
    disableParentPrompt?: boolean | null;
  }>;
}

interface TestCaseFormPromptBlockProps {
  initialSystemPrompt?: string | null;
  initialDisableParentPrompt?: boolean | null;
  parentPromptInfo?: ParentPromptInfo;
  onSave: (data: {
    systemPrompt?: string;
    disableParentPrompt?: boolean;
  }) => void | Promise<void>;
  isSaving?: boolean;
}

export default function TestCaseFormPromptBlock({
  initialSystemPrompt,
  initialDisableParentPrompt,
  parentPromptInfo,
  onSave,
  isSaving = false,
}: TestCaseFormPromptBlockProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(
    initialSystemPrompt || "",
  );
  const [currentDisableParent, setCurrentDisableParent] = useState(
    !!initialDisableParentPrompt,
  );

  const handleSubmit = async (values: TestCasePromptFormValues) => {
    await onSave({
      systemPrompt: values.systemPrompt,
      disableParentPrompt: values.disableParentPrompt,
    });
  };

  const computeCombinedPrompt = (promptVal: string, disableVal: boolean) => {
    const parts: string[] = [];

    if (parentPromptInfo?.projectPrompt) {
      parts.push(parentPromptInfo.projectPrompt);
    }

    if (parentPromptInfo?.groupsPrompts) {
      for (const grp of parentPromptInfo.groupsPrompts) {
        if (grp.disableParentPrompt) {
          parts.length = 0;
        }
        if (grp.systemPrompt) {
          parts.push(grp.systemPrompt);
        }
      }
    }

    if (disableVal) {
      parts.length = 0;
    }

    if (promptVal) {
      parts.push(promptVal);
    }

    return parts.join("\n\n");
  };

  const combinedPrompt = computeCombinedPrompt(
    currentSystemPrompt,
    currentDisableParent,
  );

  return (
    <FormBlock
      label="前置提示詞 / UI指引"
      description="設定測試案例的提示詞，將作為 AI 執行測試的指引。"
      formSchema={testCasePromptFormSchema}
      defaultValues={{
        systemPrompt: initialSystemPrompt || "",
        disableParentPrompt: !!initialDisableParentPrompt,
      }}
      onSubmit={handleSubmit}
      submitText={isSaving ? "儲存中..." : "儲存"}
      submitIcon="save"
    >
      <FormField
        name="disableParentPrompt"
        label="全域與群組繼承"
        description="開啟後將忽略專案與所屬群組的前置提示詞，僅以此測試案例專屬的 Prompt 作為 AI 指引。"
      >
        {(field) => (
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={!!field.value}
              onCheckedChange={(val) => {
                field.onChange(val);
                setCurrentDisableParent(val);
              }}
            />
            <span className="text-sm text-zinc-300">
              {field.value
                ? "已停用上層繼承 (僅使用案例自訂 Prompt)"
                : "繼承專案與群組提示詞 (預設)"}
            </span>
          </div>
        )}
      </FormField>

      <FormField
        name="systemPrompt"
        label="提示詞"
        description="此測試案例微觀層級的 UI 引導，說明該步驟頁面特殊的組件特徵。"
      >
        {(field, id) => {
          const val = field.value || "";
          return (
            <div className="space-y-2">
              <Textarea
                {...field}
                id={id}
                value={val}
                onChange={(e) => {
                  field.onChange(e);
                  setCurrentSystemPrompt(e.target.value);
                }}
                placeholder="例如: 該步驟觸發的 Popover 選擇器包含 class '.custom-popover-item'。"
                className="bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y min-h-[90px] placeholder:text-zinc-700"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                >
                  {showPreview ? (
                    <EyeOff size={13} className="mr-1" />
                  ) : (
                    <Eye size={13} className="mr-1" />
                  )}
                  {showPreview
                    ? "隱藏組合預覽"
                    : "查看最終組合提示詞 (View Combined Prompt)"}
                </Button>
                <span>{val.length} 字元</span>
              </div>

              {showPreview && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md space-y-1.5 font-mono text-xs mt-2">
                  <div className="flex items-center justify-between font-semibold text-zinc-300 border-b border-zinc-850 pb-1 text-[11px]">
                    <span>組合後注入 Agent 的 System Prompt 段落:</span>
                    <span className="text-zinc-500 font-normal">
                      總字數: {combinedPrompt.length} 字元
                    </span>
                  </div>
                  {combinedPrompt.trim() ? (
                    <pre className="whitespace-pre-wrap text-zinc-300 leading-relaxed max-h-[160px] overflow-y-auto">
                      {combinedPrompt}
                    </pre>
                  ) : (
                    <div className="text-zinc-500 italic">
                      無繼承且未設定前置提示詞 (將使用預設系統 Prompt)
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }}
      </FormField>
    </FormBlock>
  );
}
