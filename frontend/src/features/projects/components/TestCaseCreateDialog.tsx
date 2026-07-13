import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

interface TestCaseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetGroupId: string;
  setTargetGroupId: (groupId: string) => void;
  flatGroups: Array<{ id: string; name: string; depth: number }>;
  isSaving: boolean;
  onSubmit: (
    name: string,
    targetGroupId: string,
    systemPrompt?: string,
    disableParentPrompt?: boolean,
  ) => Promise<void>;
}

export default function TestCaseCreateDialog({
  open,
  onOpenChange,
  targetGroupId,
  setTargetGroupId,
  flatGroups,
  isSaving,
  onSubmit,
}: TestCaseCreateDialogProps) {
  const [tcName, setTcName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [disableParentPrompt, setDisableParentPrompt] = useState(false);

  const handleSave = async () => {
    if (!tcName.trim() || !targetGroupId) return;
    await onSubmit(
      tcName.trim(),
      targetGroupId,
      systemPrompt.trim() || undefined,
      disableParentPrompt,
    );
    setTcName("");
    setSystemPrompt("");
    setDisableParentPrompt(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setTcName("");
          setSystemPrompt("");
          setDisableParentPrompt(false);
        }
      }}
    >
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>建立全新測試案例</DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            在選定的群組下建立一個新的測試案例，後續可在案例詳情中編輯步驟。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 my-2">
          {/* 測試案例名稱 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              測試案例名稱 <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={tcName}
              onChange={(e) => setTcName(e.target.value)}
              placeholder="例如: Wikipedia 搜尋 Gemini 測試"
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
              autoFocus
            />
          </div>

          {/* 所屬群組 Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              所屬群組 <span className="text-red-500">*</span>
            </label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300">
                <SelectValue placeholder="選擇群組" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                {flatGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {"\u00A0\u00A0".repeat(g.depth)}
                    {g.depth > 0 ? "├─ " : ""}
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 停用全域繼承 Switch */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              停用全域與群組繼承
            </label>
            <div className="flex items-center gap-2">
              <Switch
                checked={disableParentPrompt}
                onCheckedChange={setDisableParentPrompt}
              />
              <span className="text-xs text-zinc-300">
                {disableParentPrompt ? "已停用上層繼承" : "繼承專案與群組提示詞 (預設)"}
              </span>
            </div>
          </div>

          {/* 案例前置提示詞 Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                前置提示詞 / UI 指引 (選填)
              </label>
              <span className="text-[10px] text-zinc-500">{systemPrompt.length} 字元</span>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="例如: 頁面中的下拉選單為動態加載，點擊後請稍候 1 秒。"
              className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-xs min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-zinc-850 pt-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-950"
            disabled={isSaving}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !tcName.trim() || !targetGroupId}
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
          >
            {isSaving ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              "儲存測試案例"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
