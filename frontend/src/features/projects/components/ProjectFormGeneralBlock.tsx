import { FormBlock, FormField } from "@/components/custom/form";
import type { generalFormSchema } from "../schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Mode, UseFormProps } from "react-hook-form";
import z from "zod";
import { IconPicker } from "@/components/ui/icon-picker";

interface ProjectFormGeneralBlockProps {
  formSchema: typeof generalFormSchema;
  defaultValues: UseFormProps<
    z.infer<typeof generalFormSchema>
  >["defaultValues"];
  onSubmit?: (data: z.infer<typeof generalFormSchema>) => void | Promise<void>;
  submitLabel?: string;
  showSubmitButton?: boolean;
  onChange?: (data: z.infer<typeof generalFormSchema>) => unknown;
  mode?: Mode;
}

export default function ProjectFormGeneralBlock({
  formSchema,
  defaultValues,
  onSubmit,
  submitLabel,
  showSubmitButton = true,
  onChange,
  mode,
}: ProjectFormGeneralBlockProps) {
  return (
    <FormBlock
      label="基本資訊"
      description="設定專案的基本資訊。"
      formSchema={formSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      submitText={submitLabel}
      submitIcon="save"
      showSubmitButton={showSubmitButton}
      onChange={onChange}
      mode={mode}
    >
      <div className="flex flex-row items-center gap-2">
        <FormField
          name="icon"
          label=""
          description=""
          className="w-[66.8px] h-[60px]"
        >
          <IconPicker triggerPlaceholder="" buttonClassName="h-full" />
        </FormField>
        <FormField name="name" label="專案名稱" description="">
          <Input placeholder="請輸入專案名稱" />
        </FormField>
      </div>

      <FormField
        name="description"
        label="專案描述"
        description="設定專案的描述。"
      >
        <Textarea placeholder="請輸入專案描述" />
      </FormField>
    </FormBlock>
  );
}
