import { AppDataSource } from "../db.js";
import { SystemSetting } from "../entities/SystemSetting.js";

/** aiConfig 的完整型別（應用層使用，保證所有欄位存在） */
export interface AiConfig {
  executorModelId: string;
  reportModelId: string;
}

/** aiConfig 的應用層預設值（兩個 ModelId 均為空字串） */
const DEFAULT_AI_CONFIG: AiConfig = {
  executorModelId: "",
  reportModelId: "",
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
  if (setting.enableReplay === undefined || setting.enableReplay === null) {
    setting.enableReplay = true;
  }


  // 在應用層補填 aiConfig 預設值，確保呼叫方永遠取得完整結構
  const dbAiConfig = setting.aiConfig ?? {};
  const aiConfig: AiConfig = {
    ...DEFAULT_AI_CONFIG,
    ...dbAiConfig,
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
