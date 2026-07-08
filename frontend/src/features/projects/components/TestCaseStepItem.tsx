import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  LoaderCircle,
  Edit,
  Save,
} from "lucide-react";

interface TestCaseStepItemProps {
  step: { action: string; expected?: string; hasExpected: boolean };
  index: number;
  isEditing: boolean;
  totalSteps: number;
  anyStepEditing: boolean;
  onEditStart: () => void;
  onCancel: () => void;
  onSave: (updatedStep: {
    action: string;
    expected?: string;
    hasExpected: boolean;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onMove: (direction: "up" | "down") => Promise<void>;
}

export default function TestCaseStepItem({
  step,
  index,
  isEditing,
  totalSteps,
  anyStepEditing,
  onEditStart,
  onCancel,
  onSave,
  onDelete,
  onMove,
}: TestCaseStepItemProps) {
  // 編輯時的內部狀態
  const [action, setAction] = useState(step.action);
  const [expected, setExpected] = useState(step.expected || "");
  const [hasExpected, setHasExpected] = useState(!!step.hasExpected);

  const [isActionSaving, setIsActionSaving] = useState(false);
  const [isActionDeleting, setIsActionDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // 當 isEditing 切換或 step 更新時，重設內部編輯狀態
  useEffect(() => {
    setAction(step.action);
    setExpected(step.expected || "");
    setHasExpected(!!step.hasExpected);
  }, [step, isEditing]);

  const handleSave = async () => {
    if (!action.trim()) return;
    setIsActionSaving(true);
    try {
      await onSave({
        action: action.trim(),
        expected: hasExpected ? expected.trim() : "",
        hasExpected,
      });
    } finally {
      setIsActionSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsActionDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsActionDeleting(false);
    }
  };

  const handleMove = async (direction: "up" | "down") => {
    setIsMoving(true);
    try {
      await onMove(direction);
    } finally {
      setIsMoving(false);
    }
  };

  // 1. 編輯狀態
  if (isEditing) {
    return (
      <div className="flex flex-col gap-2.5 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-fadeIn">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 rounded h-8 w-8 font-mono flex-shrink-0 font-bold">
            {index + 1}
          </span>
          <Input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="操作描述，如：點擊 '送出' 按鈕"
            className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-100 h-8 text-xs focus-visible:ring-emerald-500"
            disabled={isActionSaving}
          />
          <div className="flex items-center space-x-2">
            <Switch
              id={`expected-${index}`}
              checked={hasExpected}
              onCheckedChange={setHasExpected}
              disabled={isActionSaving}
            />
            <Label
              htmlFor={`expected-${index}`}
              className="text-zinc-400 text-xs cursor-pointer select-none"
            >
              預期結果
            </Label>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              disabled={isActionSaving || !action.trim()}
              className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            >
              {isActionSaving ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancel}
              disabled={isActionSaving}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
        {hasExpected && (
          <div className="pl-10 animate-fadeIn">
            <Input
              type="text"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="步驟預期結果，如：進入首頁、跳出錯誤視窗）"
              className="bg-zinc-950/40 border-zinc-900 h-7 text-[11px] placeholder:text-zinc-600 focus-visible:ring-emerald-600"
              disabled={isActionSaving}
            />
          </div>
        )}
      </div>
    );
  }

  // 2. 唯讀狀態
  return (
    <div className="group flex flex-col gap-1.5 p-3 bg-zinc-900/10 border border-zinc-900 rounded-xl hover:bg-zinc-900/20 hover:border-zinc-850 transition-all duration-200 relative animate-fadeIn">
      <div className="flex items-start gap-3 pr-28">
        <span className="h-6 w-6 bg-zinc-900 border border-zinc-850 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 font-mono mt-0.5 flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 font-medium break-words leading-tight">
            {step.action || (
              <span className="text-zinc-600 italic">空白步驟</span>
            )}
          </p>
          {step.expected && (
            <p className="text-xs text-zinc-500 mt-1 italic break-words">
              預期結果:{" "}
              <span className="text-zinc-400 not-italic">{step.expected}</span>
            </p>
          )}
        </div>
      </div>

      {/* 控制按鈕區 (Hover 時浮現) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto bg-zinc-950/80 pl-2 py-1 rounded-md border border-zinc-900 backdrop-blur-sm shadow-md">
        <Button
          size="icon"
          variant="ghost"
          disabled={anyStepEditing || index === 0 || isMoving}
          onClick={() => handleMove("up")}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="上移步驟"
        >
          {isMoving ? (
            <LoaderCircle size={12} className="animate-spin" />
          ) : (
            <ArrowUp size={12} />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={anyStepEditing || index === totalSteps - 1 || isMoving}
          onClick={() => handleMove("down")}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="下移步驟"
        >
          {isMoving ? (
            <LoaderCircle size={12} className="animate-spin" />
          ) : (
            <ArrowDown size={12} />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={anyStepEditing}
          onClick={onEditStart}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="編輯步驟"
        >
          <Edit size={12} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={anyStepEditing || isActionDeleting}
          onClick={handleDelete}
          className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
          title="刪除步驟"
        >
          {isActionDeleting ? (
            <LoaderCircle size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
        </Button>
      </div>
    </div>
  );
}
