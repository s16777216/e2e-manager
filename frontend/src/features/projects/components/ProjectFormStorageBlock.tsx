import { FormBlock, FormField } from "@/components/custom/form";
import { Textarea } from "@/components/ui/textarea";
import type { storageFormSchema } from "../schema";
import type { Mode, UseFormProps } from "react-hook-form";
import z from "zod";

interface ProjectFormStorageBlockProps {
  formSchema: typeof storageFormSchema;
  defaultValues: UseFormProps<
    z.infer<typeof storageFormSchema>
  >["defaultValues"];
  onSubmit?: (data: z.infer<typeof storageFormSchema>) => void | Promise<void>;
  submitLabel?: string;
  showSubmitButton?: boolean;
  onChange?: (data: z.infer<typeof storageFormSchema>) => unknown;
  mode?: Mode;
}

export default function ProjectFormStorageBlock({
  formSchema,
  defaultValues,
  onSubmit,
  submitLabel,
  showSubmitButton = true,
  onChange,
  mode,
}: ProjectFormStorageBlockProps) {
  return (
    <FormBlock
      label="Cookies 與 LocalStorage"
      description="設定專案的 Cookies 與 LocalStorage，將在每次執行測試時自動注入。"
      formSchema={formSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      submitText={submitLabel}
      showSubmitButton={showSubmitButton}
      onChange={onChange}
      mode={mode}
    >
      <FormField
        name="initCookies"
        label="Cookies"
        description={
          <>格式為 JSON 物件，例如 {'`{"domain/path": {"key": "value"}}`'}</>
        }
      >
        <Textarea
          placeholder={`{\n  "localhost/": {\n    "token": "jwt-token-here"\n  }\n}`}
          className={`bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y placeholder:text-zinc-700 no-scrollbar`}
        />
      </FormField>
      <FormField
        name="initLocalStorage"
        label="LocalStorage"
        description={
          <>格式為 JSON 物件，例如 {'`{"domain/path": {"key": "value"}}`'}</>
        }
      >
        <Textarea
          placeholder={`{\n  "theme": "dark",\n  "version": "1.0"\n}`}
          className={`bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y placeholder:text-zinc-700 no-scrollbar`}
        />
      </FormField>
    </FormBlock>
  );
}
