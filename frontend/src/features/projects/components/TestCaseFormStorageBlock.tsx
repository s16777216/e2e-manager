import { FormBlock, FormField } from "@/components/custom/form";
import Typography from "@/components/custom/Typography";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";

function validateCookies(str: string): {
  parsed: unknown;
  isValid: boolean;
  error: string | null;
} {
  const trimmed = str.trim();
  if (trimmed === "") return { parsed: null, isValid: true, error: null };
  try {
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {
        parsed: null,
        isValid: false,
        error:
          'Cookies 必須為 JSON 物件格式 (例如: { "domain/path": { "name": "value" } })',
      };
    }
    return { parsed: parsed, isValid: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { parsed: null, isValid: false, error: `JSON 解析失敗: ${msg}` };
  }
}

function validateLocalStorage(str: string): {
  parsed: unknown;
  isValid: boolean;
  error: string | null;
} {
  const trimmed = str.trim();
  if (trimmed === "") return { parsed: null, isValid: true, error: null };
  try {
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {
        parsed: null,
        isValid: false,
        error: 'LocalStorage 必須為 JSON 物件格式 (例如: { "key": "value" })',
      };
    }
    return { parsed: parsed, isValid: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { parsed: null, isValid: false, error: `JSON 解析失敗: ${msg}` };
  }
}

const testCaseStorageFormSchema = z.object({
  initCookies: z
    .string()
    .refine(
      (val) => validateCookies(val).isValid,
      {
        message: 'Cookies 必須為 JSON 物件格式 (例如: { "domain/path": { "name": "value" } })',
      }
    ),
  initLocalStorage: z
    .string()
    .refine(
      (val) => validateLocalStorage(val).isValid,
      {
        message: 'LocalStorage 必須為 JSON 物件格式 (例如: { "key": "value" })',
      }
    ),
});

type TestCaseStorageFormValues = z.infer<typeof testCaseStorageFormSchema>;

interface TestCaseFormStorageBlockProps {
  initialCookies: unknown;
  initialLocalStorage: unknown;
  onSave: (data: { initCookies: unknown; initLocalStorage: unknown }) => void | Promise<void>;
  isSaving?: boolean;
}

export default function TestCaseFormStorageBlock({
  initialCookies,
  initialLocalStorage,
  onSave,
  isSaving = false,
}: TestCaseFormStorageBlockProps) {
  const defaultCookiesStr = initialCookies
    ? JSON.stringify(initialCookies, null, 2)
    : "";
  const defaultLocalStorageStr = initialLocalStorage
    ? JSON.stringify(initialLocalStorage, null, 2)
    : "";

  const handleSubmit = async (values: TestCaseStorageFormValues) => {
    const cookiesParsed = validateCookies(values.initCookies).parsed;
    const localStorageParsed = validateLocalStorage(values.initLocalStorage).parsed;
    await onSave({
      initCookies: cookiesParsed,
      initLocalStorage: localStorageParsed,
    });
  };

  return (
    <FormBlock
      label="Cookies 與 LocalStorage"
      description="設定此測試案例專屬的 Cookies 與 LocalStorage，將在執行此案例時自動注入（會與專案/群組層級合併，此處設定優先權最高）。"
      formSchema={testCaseStorageFormSchema}
      defaultValues={{
        initCookies: defaultCookiesStr,
        initLocalStorage: defaultLocalStorageStr,
      }}
      onSubmit={handleSubmit}
      submitText={isSaving ? "儲存中..." : "儲存"}
      submitIcon="save"
    >
      <FormField
        name="initCookies"
        label="Cookies"
        description={
          <Typography type="muted" className="text-[10px] leading-tight">
            格式為 JSON 物件，例如 {'`{"domain/path": {"key": "value"}}`'}
          </Typography>
        }
      >
        <Textarea
          placeholder={`{\n  "localhost/": {\n    "token": "jwt-token-here"\n  }\n}`}
          className={`bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y placeholder:text-zinc-700 no-scrollbar`}
          rows={6}
        />
      </FormField>
      <FormField
        name="initLocalStorage"
        label="LocalStorage"
        description={
          <Typography type="muted" className="text-[10px] leading-tight">
            格式為 JSON 物件，例如 {'`{"key": "value"}`'}
          </Typography>
        }
      >
        <Textarea
          placeholder={`{\n  "theme": "dark",\n  "version": "1.0"\n}`}
          className={`bg-zinc-950/80 border text-zinc-100 font-mono text-xs resize-y placeholder:text-zinc-700 no-scrollbar`}
          rows={6}
        />
      </FormField>
    </FormBlock>
  );
}
