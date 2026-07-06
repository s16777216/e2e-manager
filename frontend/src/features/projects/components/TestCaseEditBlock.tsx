import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, LoaderCircle } from "lucide-react";
import { JsonEditorAccordion } from "../../../components/custom/JsonEditorAccordion";
import { VariablesEditor } from "../../../components/custom/VariablesEditor";
import type { Testcase, VariableItem } from "@/types/api";

interface TestCaseEditBlockProps {
  testcase: Testcase;
  isSaving: boolean;
  onSave: (data: {
    name: string;
    steps: Array<{ action: string; expected?: string; hasExpected: boolean }>;
    expected: string;
    initCookies: unknown;
    initLocalStorage: unknown;
    variables: Record<string, VariableItem>;
  }) => Promise<void>;
  onCancel: () => void;
  onDeleteClick: () => void;
}

export default function TestCaseEditBlock({
  testcase,
  isSaving,
  onSave,
  onCancel,
  onDeleteClick,
}: TestCaseEditBlockProps) {
  const [tcName, setTcName] = useState(testcase.name);
  const [tcSteps, setTcSteps] = useState<
    Array<{ action: string; expected?: string; hasExpected: boolean }>
  >(
    testcase.steps && testcase.steps.length > 0
      ? testcase.steps.map((s) => ({
          action: s.action,
          expected: s.expected,
          hasExpected: !!s.hasExpected,
        }))
      : [{ action: "", expected: "", hasExpected: false }],
  );
  const [tcExpected, setTcExpected] = useState(testcase.expected);
  const [initCookies, setInitCookies] = useState<unknown>(testcase.initCookies);
  const [initLocalStorage, setInitLocalStorage] = useState<unknown>(
    testcase.initLocalStorage,
  );
  const [tcVariables, setTcVariables] = useState<Record<string, VariableItem>>(
    testcase.variables || {},
  );
  const [isJsonValid, setIsJsonValid] = useState(true);

  // 步驟表單增減
  const handleAddStepInput = () => {
    setTcSteps([...tcSteps, { action: "", expected: "", hasExpected: false }]);
  };

  const handleRemoveStepInput = (index: number) => {
    if (tcSteps.length === 1) return;
    const newSteps = [...tcSteps];
    newSteps.splice(index, 1);
    setTcSteps(newSteps);
  };

  const handleStepActionChange = (index: number, val: string) => {
    const newSteps = [...tcSteps];
    newSteps[index] = { ...newSteps[index], action: val };
    setTcSteps(newSteps);
  };

  const handleStepExpectedChange = (index: number, val: string) => {
    const newSteps = [...tcSteps];
    newSteps[index] = { ...newSteps[index], expected: val };
    setTcSteps(newSteps);
  };

  const handleSubmit = async () => {
    if (!isJsonValid) return;
    await onSave({
      name: tcName.trim(),
      steps: tcSteps.map((s) => ({
        action: s.action.trim(),
        expected: s.expected?.trim() || "",
        hasExpected: !!s.hasExpected,
      })),
      expected: tcExpected.trim(),
      initCookies,
      initLocalStorage,
      variables: tcVariables,
    });
  };

  const isFormInvalid =
    !tcName.trim() ||
    tcSteps.some((s) => !s.action.trim()) ||
    !isJsonValid;

  return (
    <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6 flex flex-col gap-5 shadow-lg">
      {/* 編輯名稱 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          測試案例名稱 <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={tcName}
          onChange={(e) => setTcName(e.target.value)}
          placeholder="修改測試案例名稱"
          className="bg-zinc-950 border-zinc-800 text-zinc-100"
        />
      </div>

      {/* 編輯自然語言步驟 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
          <span>測試步驟</span>
          <span className="text-[9px] text-emerald-500 font-mono normal-case">
            {"(支援 {{變數}} 引用)"}
          </span>
          <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-3">
          {tcSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 rounded h-8 w-8 font-mono flex-shrink-0">
                  {idx + 1}
                </span>
                <Input
                  type="text"
                  value={step.action}
                  onChange={(e) => handleStepActionChange(idx, e.target.value)}
                  placeholder="操作描述，如：點擊 '送出' 按鈕"
                  className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-100 h-8 text-xs focus-visible:ring-emerald-500"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`expected-${idx}`}
                    checked={!!step.hasExpected}
                    onCheckedChange={(checked) => {
                      const newSteps = [...tcSteps];
                      newSteps[idx].hasExpected = checked;
                      setTcSteps(newSteps);
                    }}
                  />
                  <Label
                    htmlFor={`expected-${idx}`}
                    className="text-zinc-400 text-xs cursor-pointer select-none"
                  >
                    預期結果
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveStepInput(idx)}
                  className="border-zinc-800 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 flex-shrink-0 h-8 w-8"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
              {step.hasExpected && (
                <div className="pl-10 animate-fadeIn">
                  <Input
                    type="text"
                    value={step.expected || ""}
                    onChange={(e) =>
                      handleStepExpectedChange(idx, e.target.value)
                    }
                    placeholder="步驟預期結果，如：進入首頁、跳出錯誤視窗、出現註冊按鈕、未出現xxx）"
                    className="bg-zinc-950/40 border-zinc-900 h-7 text-[11px] placeholder:text-zinc-600 focus-visible:ring-emerald-600"
                  />
                </div>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddStepInput}
            className="self-start text-[10px] border-zinc-850 hover:bg-zinc-900 text-zinc-300"
          >
            <Plus size={10} className="mr-1" /> 新增下一步
          </Button>
        </div>
      </div>

      {/* 編輯預期結果 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
          <span>最終預期結果 (選填，僅作備註說明)</span>
          <span className="text-[9px] text-emerald-500 font-mono normal-case">
            {"(支援 {{變數}} 引用)"}
          </span>
        </label>
        <Textarea
          value={tcExpected}
          onChange={(e) => setTcExpected(e.target.value)}
          placeholder="填寫測試最終預期結果（選填，AI 不會以此進行全局斷言）"
          rows={3}
          className="resize-none bg-zinc-950 border-zinc-800 text-zinc-100"
        />
      </div>

      <JsonEditorAccordion
        initCookies={testcase.initCookies}
        initLocalStorage={testcase.initLocalStorage}
        onChange={({ cookies, localStorage, isValid }) => {
          setInitCookies(cookies);
          setInitLocalStorage(localStorage);
          setIsJsonValid(isValid);
        }}
      />

      <VariablesEditor
        variables={tcVariables}
        onChange={(newVars) => setTcVariables(newVars)}
      />

      {/* 刪除測試案例入口 */}
      <div className="border-t border-zinc-900/60 pt-5 mt-2 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider">
          危險區域
        </label>
        <Button
          type="button"
          variant="ghost"
          onClick={onDeleteClick}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-1.5 self-start"
        >
          <Trash2 size={14} />
          刪除測試案例
        </Button>
      </div>

      {/* 表單底操作 */}
      <div className="flex justify-end gap-2 border-t border-zinc-850 pt-4 mt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-950"
        >
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || isFormInvalid}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
        >
          {isSaving ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            "儲存修改"
          )}
        </Button>
      </div>
    </div>
  );
}
