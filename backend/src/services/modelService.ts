import { AppDataSource } from "../db.js";
import { ModelSetting } from "../entities/ModelSetting.js";
import { SystemSetting } from "../entities/SystemSetting.js";

/** 角色 ID key → 顯示名稱 */
const ROLE_LABEL: Record<string, string> = {
  executorModelId: "執行器",
  reportModelId: "報告器",
};

export async function getAllModels(): Promise<ModelSetting[]> {
  return AppDataSource.getRepository(ModelSetting).find({
    order: { createdAt: "ASC" },
  });
}

export async function createModel(dto: Partial<ModelSetting>): Promise<ModelSetting> {
  const repo = AppDataSource.getRepository(ModelSetting);
  const entity = repo.create(dto);
  return repo.save(entity);
}

export async function updateModel(
  id: string,
  dto: Partial<ModelSetting>,
): Promise<ModelSetting | null> {
  const repo = AppDataSource.getRepository(ModelSetting);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;
  Object.assign(existing, dto);
  return repo.save(existing);
}

/**
 * 刪除模型前先查詢 system_setting.aiConfig 是否有角色引用該 ID。
 * 若有，拋出 409 業務錯誤，訊息含角色顯示名稱。
 */
export async function deleteModel(id: string): Promise<void> {
  const modelRepo = AppDataSource.getRepository(ModelSetting);
  const settingRepo = AppDataSource.getRepository(SystemSetting);

  // 確認模型存在
  const model = await modelRepo.findOne({ where: { id } });
  if (!model) {
    const err: any = new Error("模型不存在");
    err.statusCode = 404;
    throw err;
  }

  // 查詢是否被任一角色引用
  const settings = await settingRepo.findOne({ where: { id: "default" } });
  if (settings?.aiConfig) {
    const usedRoles: string[] = [];
    for (const [key, label] of Object.entries(ROLE_LABEL)) {
      if ((settings.aiConfig as any)[key] === id) {
        usedRoles.push(`「${label}」`);
      }
    }
    if (usedRoles.length > 0) {
      const err: any = new Error(
        `此模型正被 ${usedRoles.join("、")} 使用中，請先取消角色指定後再刪除。`,
      );
      err.statusCode = 409;
      throw err;
    }
  }

  await modelRepo.remove(model);
}
