import type { CookiesData, LocalStorageData } from "@/types/api";
import z from "zod";

function validateCookies(str: string): {
  parsed: CookiesData | null;
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
    return { parsed: parsed as CookiesData, isValid: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { parsed: null, isValid: false, error: `JSON 解析失敗: ${msg}` };
  }
}

function validateLocalStorage(str: string): {
  parsed: LocalStorageData | null;
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
    return { parsed: parsed as LocalStorageData, isValid: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { parsed: null, isValid: false, error: `JSON 解析失敗: ${msg}` };
  }
}

export const schema = z.object({
  name: z.string().min(1, "專案名稱為必填"),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  initCookies: z
    .custom<string>(
      (val) => {
        const { parsed, isValid, error } = validateCookies(val);
        if (!isValid) {
          throw new Error(error || "Cookies 格式錯誤");
        }
        return parsed;
      },
      {
        message:
          'Cookies 必須為 JSON 物件格式 (例如: { "domain/path": { "name": "value" } })',
      },
    )
    .optional(),
  initLocalStorage: z
    .custom<string>(
      (val) => {
        const { parsed, isValid, error } = validateLocalStorage(val);
        if (!isValid) {
          throw new Error(error || "LocalStorage 格式錯誤");
        }
        return parsed;
      },
      {
        message: 'LocalStorage 必須為 JSON 物件格式 (例如: { "key": "value" })',
      },
    )
    .optional(),
  variables: z
    .record(
      z.object({
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export const generalFormSchema = schema.pick({
  name: true,
  description: true,
});

export const promptFormSchema = schema.pick({
  systemPrompt: true,
});

export const storageFormSchema = schema.pick({
  initCookies: true,
  initLocalStorage: true,
});

export type ProjectSchema = z.infer<typeof schema>;
export type GeneralFormSchema = z.infer<typeof generalFormSchema>;
export type PromptFormSchema = z.infer<typeof promptFormSchema>;
export type StorageFormSchema = z.infer<typeof storageFormSchema>;
