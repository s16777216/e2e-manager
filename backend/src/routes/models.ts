import { Hono } from "hono";
import {
  getAllModels,
  createModel,
  updateModel,
  deleteModel,
} from "../services/modelService.js";

export const modelsRouter = new Hono();

/** GET /api/models — 列出所有模型設定 */
modelsRouter.get("/", async (c) => {
  const models = await getAllModels();
  return c.json(models);
});

/** POST /api/models — 新增模型設定 */
modelsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const model = await createModel(body);
  return c.json(model, 201);
});

/** PATCH /api/models/:id — 更新模型設定 */
modelsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const updated = await updateModel(id, body);
  if (!updated) {
    return c.json({ error: "模型不存在" }, 404);
  }
  return c.json(updated);
});

/** DELETE /api/models/:id — 刪除模型設定（有引用保護） */
modelsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await deleteModel(id);
    return c.body(null, 204);
  } catch (err: any) {
    const status = err.statusCode === 409 ? 409 : err.statusCode === 404 ? 404 : 500;
    return c.json({ error: err.message }, status as any);
  }
});
