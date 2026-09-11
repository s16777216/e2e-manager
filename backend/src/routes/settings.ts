import { Hono } from "hono";
import { getSettings, saveSettings } from "../services/settingsService.js";
import { getDatabaseStorageMetrics } from "../services/storageService.js";
import { AppDataSource } from "../db.js";
import { TestRun } from "../entities/TestRun.js";

export const settingsRouter = new Hono();

// GET /api/settings
settingsRouter.get("/settings", async (c) => {
  try {
    const settings = await getSettings();
    return c.json(settings);
  } catch (error: any) {
    return c.json({ error: `讀取設定失敗: ${error.message}` }, 500);
  }
});

// POST /api/settings
settingsRouter.post("/settings", async (c) => {
  try {
    const body = await c.req.json();
    const updated = await saveSettings(body);
    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: `更新設定失敗: ${error.message}` }, 500);
  }
});

// GET /api/settings/storage
settingsRouter.get("/settings/storage", async (c) => {
  try {
    const metrics = await getDatabaseStorageMetrics();
    return c.json(metrics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知錯誤";
    return c.json({ error: `獲取資料庫儲存空間指標失敗: ${message}` }, 500);
  }
});

// DELETE /api/settings/history
settingsRouter.delete("/settings/history", async (c) => {
  try {
    const runRepo = AppDataSource.getRepository(TestRun);
    // 刪除所有 TestRun，PostgreSQL 會透過外鍵 CASCADE 級聯清除所有關聯的 TestRunStep 與 TestLog
    await runRepo.createQueryBuilder().delete().execute();
    return c.json({ message: "歷史紀錄清除成功" });
  } catch (error: any) {
    return c.json({ error: `清除歷史紀錄失敗: ${error.message}` }, 500);
  }
});
