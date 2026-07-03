import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { VariableItem } from "@/types/api";

interface VariablesEditorProps {
  variables?: Record<string, VariableItem> | null;
  onChange: (variables: Record<string, VariableItem>) => void;
}

interface LocalPair {
  key: string;
  value: string;
  description: string;
}

function parseVariablesToPairs(
  variables?: Record<string, VariableItem> | null,
): LocalPair[] {
  return variables && typeof variables === "object"
    ? Object.entries(variables).map(([key, item]) => {
        if (item && typeof item === "object") {
          return {
            key,
            value: String(item.value ?? ""),
            description: String(item.description ?? ""),
          };
        } else {
          return {
            key,
            value: String(item ?? ""),
            description: "",
          };
        }
      })
    : [];
}

export function VariablesEditor({ variables, onChange }: VariablesEditorProps) {
  const [pairs, setPairs] = useState<LocalPair[]>(() =>
    parseVariablesToPairs(variables),
  );

  // Dialog 相關狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 彈窗輸入暫存狀態與錯誤提示
  const [tempKey, setTempKey] = useState("");
  const [tempValue, setTempValue] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [keyError, setKeyError] = useState("");

  const [prevVariables, setPrevVariables] = useState(variables);

  if (variables !== prevVariables) {
    setPrevVariables(variables);
    const initialPairs = parseVariablesToPairs(variables);

    const currentKeys = pairs.map((p) => p.key).join(",");
    const initialKeys = initialPairs.map((p) => p.key).join(",");
    const currentValues = pairs.map((p) => p.value).join(",");
    const initialValues = initialPairs.map((p) => p.value).join(",");
    const currentDescs = pairs.map((p) => p.description).join(",");
    const initialDescs = initialPairs.map((p) => p.description).join(",");

    if (
      currentKeys !== initialKeys ||
      currentValues !== initialValues ||
      currentDescs !== initialDescs
    ) {
      setPairs(initialPairs);
    }
  }

  // 更新外部狀態
  const triggerChange = (newPairs: LocalPair[]) => {
    setPairs(newPairs);
    const obj: Record<string, VariableItem> = {};
    newPairs.forEach((p) => {
      if (p.key.trim()) {
        obj[p.key.trim()] = {
          value: p.value,
          description: p.description.trim() ? p.description.trim() : undefined,
        };
      }
    });
    onChange(obj);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingIndex(null);
    setTempKey("");
    setTempValue("");
    setTempDescription("");
    setKeyError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (index: number) => {
    setModalMode("edit");
    setEditingIndex(index);
    setTempKey(pairs[index].key);
    setTempValue(pairs[index].value);
    setTempDescription(pairs[index].description);
    setKeyError("");
    setIsModalOpen(true);
  };

  const handleRemove = (index: number) => {
    const nextPairs = pairs.filter((_, i) => i !== index);
    triggerChange(nextPairs);
  };

  const handleSave = () => {
    const trimmedKey = tempKey.trim();
    if (!trimmedKey) {
      setKeyError("變數名稱不可為空");
      return;
    }

    // 檢查 Key 是否與現有其他變數重複
    const isDuplicate = pairs.some(
      (p, i) =>
        p.key.toLowerCase() === trimmedKey.toLowerCase() && i !== editingIndex,
    );
    if (isDuplicate) {
      setKeyError("變數名稱重複，請使用其他名稱");
      return;
    }

    const nextPairs = [...pairs];
    if (modalMode === "add") {
      nextPairs.push({
        key: trimmedKey,
        value: tempValue,
        description: tempDescription,
      });
    } else if (editingIndex !== null) {
      nextPairs[editingIndex] = {
        key: trimmedKey,
        value: tempValue,
        description: tempDescription,
      };
    }

    triggerChange(nextPairs);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4 backdrop-blur-sm">
      {/* 變數列表 */}
      {pairs.length > 0 ? (
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950/60 divide-y divide-zinc-900/60">
          {pairs.map((pair, index) => (
            <div
              key={index}
              className="flex flex-col p-3 hover:bg-zinc-900/20 group transition-all gap-1"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-zinc-200 font-semibold">
                    {pair.key}
                  </span>
                  <span className="text-zinc-600">=</span>
                  <span
                    className="text-zinc-400 truncate max-w-[200px] md:max-w-[320px]"
                    title={pair.value}
                  >
                    {pair.value || (
                      <span className="italic text-zinc-700">空值</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditModal(index)}
                    className="h-7 w-7 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/20 cursor-pointer"
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              {pair.description && (
                <div className="text-[10px] text-zinc-500 pl-6 flex items-center gap-1">
                  <span className="truncate max-w-[90%]">
                    {pair.description}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-zinc-900 rounded-lg bg-zinc-950/20 text-zinc-500 text-xs">
          尚未設定任何環境變數
        </div>
      )}

      {/* 新增變數按鈕 */}
      <Button
        type="button"
        variant="outline"
        onClick={handleOpenAddModal}
        className="w-full border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200 text-xs py-1.5 h-8 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus size={12} />
        新增變數
      </Button>

      {/* 新增/編輯 Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "新增環境變數" : "編輯環境變數"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              請輸入環境變數的名稱與值。變數名稱將被用來進行模板替換。支援 JS 表達式，如{" "}
              <code className="bg-zinc-950/80 px-1 py-0.5 rounded font-mono text-zinc-300">
                {"{{crypto.randomUUID()}}"}
              </code>
              ，及快照{" "}
              <code className="bg-zinc-950/80 px-1 py-0.5 rounded font-mono text-zinc-300">
                {"{{$vars.myId ??= crypto.randomUUID()}}"}
              </code>
              。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                變數名稱 (Key)
              </label>
              <Input
                placeholder="例如: api_key"
                value={tempKey}
                onChange={(e) => {
                  setTempKey(e.target.value);
                  setKeyError("");
                }}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-xs focus-visible:ring-emerald-500"
              />
              {keyError && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {keyError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                變數值 (Value)
              </label>
              <Input
                placeholder="transparent"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-xs focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                變數描述 (Description)
              </label>
              <Input
                placeholder="例如: 用於 API 認證的 Bearer Token"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-emerald-500"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-850 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-950 hover:text-zinc-200 cursor-pointer"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
            >
              確認儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
