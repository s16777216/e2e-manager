import { FormBlock, FormField } from "@/components/custom/form";
import { Input } from "@/components/ui/input";
import z from "zod";

const testCaseGeneralFormSchema = z.object({
  name: z.string().min(1, "測試案例名稱為必填"),
});

type TestCaseGeneralFormValues = z.infer<typeof testCaseGeneralFormSchema>;

interface TestCaseFormGeneralBlockProps {
  initialName: string;
  onSave: ({ name }: { name: string }) => void | Promise<void>;
  isSaving?: boolean;
}

export default function TestCaseFormGeneralBlock({
  initialName,
  onSave,
  isSaving = false,
}: TestCaseFormGeneralBlockProps) {
  const handleSubmit = async (values: TestCaseGeneralFormValues) => {
    await onSave({
      name: values.name,
    });
  };

  return (
    <FormBlock
      label="基本資訊"
      description="設定測試案例的名稱與基本資訊。"
      formSchema={testCaseGeneralFormSchema}
      defaultValues={{ name: initialName }}
      onSubmit={handleSubmit}
      submitText={isSaving ? "儲存中..." : "儲存"}
      submitIcon="save"
    >
      <FormField
        name="name"
        label="測試案例名稱"
        description="這將作為執行報告與列表中顯示的標題。"
      >
        <Input
          placeholder="請輸入測試案例名稱"
          className="bg-zinc-950/80 border text-zinc-100"
        />
      </FormField>
    </FormBlock>
  );
}
