import { AppDataSource } from "../db.js";
import { SystemSetting } from "../entities/SystemSetting.js";

/** aiConfig 的完整型別（應用層使用，包含預設值後保證所有欄位存在） */
export interface AiConfig {
  provider: string;
  executorProvider: string;
  apiKey: string;
  baseUrl: string;
  openaiApiKey: string;
  geminiModel: string;
  openaiModel: string;
}

/** aiConfig 的應用層預設值（provider=google，使用環境變數的 API Key） */
const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "",
  executorProvider: "",
  apiKey: "",
  baseUrl: "",
  openaiApiKey: "",
  geminiModel: "",
  openaiModel: "",
};

/**
 * 取得全域系統設定。若無設定則會自動寫入並回傳預設值。
 * aiConfig 為 null 時，在應用層補填預設值（不回寫 DB）。
 */
export async function getSettings(): Promise<
  SystemSetting & { aiConfig: AiConfig }
> {
  const settingRepo = AppDataSource.getRepository(SystemSetting);
  let setting = await settingRepo.findOne({ where: { id: "default" } });

  if (!setting) {
    setting = new SystemSetting();
    await settingRepo.save(setting);
  }

  // 在應用層補填 aiConfig 預設值，確保呼叫方永遠取得完整結構
  const dbAiConfig = setting.aiConfig ?? {};
  const providerFallback = dbAiConfig.provider ?? DEFAULT_AI_CONFIG.provider;
  const aiConfig: AiConfig = {
    ...DEFAULT_AI_CONFIG,
    ...dbAiConfig,
    executorProvider: dbAiConfig.executorProvider ?? providerFallback,
  };

  return { ...setting, aiConfig };
}

/**
 * 儲存/更新全域系統設定。
 */
export async function saveSettings(
  settings: Partial<SystemSetting>,
): Promise<SystemSetting> {
  const settingRepo = AppDataSource.getRepository(SystemSetting);
  const current = await getSettings();

  // 覆寫更動的欄位值，排除主鍵 id
  const { id, ...updateFields } = settings;
  Object.assign(current, updateFields);

  return await settingRepo.save(current);
}
