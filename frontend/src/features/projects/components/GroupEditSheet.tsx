import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { VariablesEditor } from "@/components/custom/VariablesEditor";
import { FormBlock, FormField } from "@/components/custom/form";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { TestGroup, VariableItem } from "@/types/api";
import * as z from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GroupEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit: TestGroup;
  onUpdateGroup: (
    name: string,
    initCookies?: unknown,
    initLocalStorage?: unknown,
    variables?: Record<string, VariableItem>,
    systemPrompt?: string,
    disableParentPrompt?: boolean,
  ) => Promise<unknown>;
}

const formSchema = z.object({
  name: z.string().trim().min(1, "群組名稱為必填欄位"),
  systemPrompt: z.string().optional(),
  disableParentPrompt: z.boolean().optional(),
  initCookies: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      try {
        const parsed = JSON.parse(val);
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    }, 'Cookies 必須為 JSON 物件格式 (例如: { "domain/path": { "name": "value" } })'),
  initLocalStorage: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      try {
        const parsed = JSON.parse(val);
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    }, 'LocalStorage 必須為 JSON 物件格式 (例如: { "key": "value" })'),
  variables: z.record(z.any()),
});

type FormValues = z.infer<typeof formSchema>;

export function GroupEditSheet({
  open,
  onOpenChange,
  groupToEdit,
  onUpdateGroup,
}: GroupEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const parsedCookies = values.initCookies?.trim()
        ? JSON.parse(values.initCookies)
        : null;
      const parsedLocalStorage = values.initLocalStorage?.trim()
        ? JSON.parse(values.initLocalStorage)
        : null;
      await onUpdateGroup(
        values.name,
        parsedCookies,
        parsedLocalStorage,
        values.variables,
        values.systemPrompt,
        values.disableParentPrompt,
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <FormBlock
          key={`edit-${groupToEdit.id}`}
          label="編輯群組"
          description="修改群組設定，這些設定會套用到此群組及其子群組底下的所有測試案例。"
          layout="vertical"
          formSchema={formSchema}
          defaultValues={{
            name: groupToEdit.name,
            systemPrompt: groupToEdit.systemPrompt || "",
            disableParentPrompt: !!groupToEdit.disableParentPrompt,
            initCookies: groupToEdit.initCookies
              ? JSON.stringify(groupToEdit.initCookies, null, 2)
              : "",
            initLocalStorage: groupToEdit.initLocalStorage
              ? JSON.stringify(groupToEdit.initLocalStorage, null, 2)
              : "",
            variables: groupToEdit.variables || {},
          }}
          onSubmit={onSubmit}
          showSubmitButton={false}
          className="flex-1"
        >
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 w-full h-full">
              <FormField name="name" label="群組名稱">
                <Input
                  id="newSubgroupName"
                  placeholder="例如: 帳戶中心"
                  className="bg-zinc-950 border-zinc-850 text-zinc-100"
                  autoFocus
                />
              </FormField>

              <FormField
                name="disableParentPrompt"
                label="停用全域繼承"
                description="開啟後將忽略專案與上層群組的前置提示詞，僅使用此層級與下層的提示詞。"
              >
                {(field) => (
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm text-zinc-300">
                      {field.value ? "已停用上層繼承" : "繼承全域與上層提示詞 (預設)"}
                    </span>
                  </div>
                )}
              </FormField>

              <FormField
                name="systemPrompt"
                label="前置提示詞 / UI 指引 (System Prompt)"
                description="此群組專屬的 UI 結構指引，會套用到此群組及其子群組下所有的測試案例。"
              >
                {(field, id) => (
                  <div className="space-y-1">
                    <Textarea
                      {...field}
                      id={id}
                      value={field.value ?? ""}
                      placeholder="例如: 帳戶中心頁面的表單控制項輸入後會自動觸發非同步驗證。"
                      className="bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y min-h-[90px] placeholder:text-zinc-700"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {(field.value || "").length} 字元
                    </div>
                  </div>
                )}
              </FormField>

              <FormField
                name="initCookies"
                label="初始 Cookies (JSON 物件)"
                description="設定將在每次執行測試時自動注入的 Cookie。"
              >
                <Textarea
                  placeholder={`{\n  "localhost/": {\n    "token": "jwt-token-here"\n  }\n}`}
                  className="bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y min-h-[100px] placeholder:text-zinc-700 no-scrollbar"
                />
              </FormField>

              <FormField
                name="initLocalStorage"
                label="初始 LocalStorage (JSON 物件)"
                description="設定將在每次執行測試時自動注入的 LocalStorage。"
              >
                <Textarea
                  placeholder={`{\n  "user_theme": "dark",\n  "login_status": "true"\n}`}
                  className="bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y min-h-[100px] placeholder:text-zinc-700 no-scrollbar"
                />
              </FormField>

              <FormField
                name="variables"
                label="全域變數"
                description="設定將在每次執行測試時自動套用的全域變數。"
              >
                {(field) => (
                  <VariablesEditor
                    variables={field.value}
                    onChange={field.onChange}
                  />
                )}
              </FormField>

              <div className="flex justify-end gap-2 border-t border-zinc-900/60 pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold"
                >
                  {isSubmitting ? "儲存中..." : "儲存設定"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </FormBlock>
      </SheetContent>
    </Sheet>
  );
}
