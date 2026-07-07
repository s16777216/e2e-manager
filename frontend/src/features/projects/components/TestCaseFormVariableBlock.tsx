import { FormBlock } from "@/components/custom/form";
import { VariablesEditor } from "../../../components/custom/VariablesEditor";
import { useState } from "react";
import type { VariableItem } from "@/types/api";

interface TestCaseFormVariableBlockProps {
  initialVariables: Record<string, VariableItem>;
  onSave: (variables: Record<string, VariableItem>) => void | Promise<void>;
  isSaving?: boolean;
}

export default function TestCaseFormVariableBlock({
  initialVariables,
  onSave,
  isSaving = false,
}: TestCaseFormVariableBlockProps) {
  const [variables, setVariables] = useState<Record<string, VariableItem>>(
    initialVariables || {},
  );

  const handleSubmit = async () => {
    await onSave(variables);
  };

  return (
    <FormBlock
      label="環境變數"
      description="設定測試案例執行時的環境變數。這些變數會覆寫專案或群組層級同名的變數，步驟中可使用 {{變數名}} 進行引用。"
      onSubmit={handleSubmit}
      submitText={isSaving ? "儲存中..." : "儲存"}
      submitIcon="save"
    >
      <div className="w-full">
        <VariablesEditor
          variables={variables}
          onChange={(newVars) => setVariables(newVars)}
        />
      </div>
    </FormBlock>
  );
}
