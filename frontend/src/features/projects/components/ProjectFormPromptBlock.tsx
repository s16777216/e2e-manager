import { FormBlock, FormField } from "@/components/custom/form";
import type { promptFormSchema } from "../schema";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormProps } from "react-hook-form";
import z from "zod";

interface ProjectFormPromptBlockProps {
  formSchema: typeof promptFormSchema;
  defaultValues: UseFormProps<
    z.infer<typeof promptFormSchema>
  >["defaultValues"];
  onSubmit: (data: z.infer<typeof promptFormSchema>) => void | Promise<void>;
  submitLabel?: string;
}

export default function ProjectFormPromptBlock({
  formSchema,
  defaultValues,
  onSubmit,
  submitLabel,
}: ProjectFormPromptBlockProps) {
  return (
    <FormBlock
      label="前置提示詞 / UI 指引"
      description="專案層級的 UI 結構引導詞，會自動向專案下所有測試案例注入。"
      formSchema={formSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      submitText={submitLabel}
      submitIcon="save"
    >
      <FormField
        name="systemPrompt"
        label="提示詞"
        description="說明此專案所使用的全域 UI 套件或 DOM 結構特徵。"
      >
        {(field, id) => (
          <div className="space-y-1">
            <Textarea
              {...field}
              id={id}
              value={field.value ?? ""}
              placeholder="例如: 專案全域 UI 使用 Ant Design v5，彈出 Modal 都在 body 根目錄下渲染。"
              className="font-mono text-sm min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground text-right">
              {(field.value || "").length} 字元
            </div>
          </div>
        )}
      </FormField>
    </FormBlock>
  );
}
