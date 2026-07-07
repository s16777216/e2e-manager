import { Hono } from "hono";
import { AppDataSource } from "../db.js";
import { TestGroup } from "../entities/TestGroup.js";
import { Project } from "../entities/Project.js";
import { Testcase } from "../entities/Testcase.js";
import { findAncestors } from "../services/groupService.js";

export const groupRouter = new Hono();

groupRouter.get("/projects/:projectId/groups", async (c) => {
  const projectId = c.req.param("projectId");
  const groupRepo = AppDataSource.getTreeRepository(TestGroup);

  // 找出該專案的所有群組
  const allGroups = await groupRepo.find({
    where: { project: { id: projectId } },
    relations: { parent: true },
  });

  // 獲取該專案下所有群組的 testcase 數量
  const counts = await AppDataSource.getRepository(Testcase)
    .createQueryBuilder("tc")
    .select("tc.groupId", "groupId")
    .addSelect("COUNT(*)", "count")
    .groupBy("tc.groupId")
    .getRawMany();

  const countMap = new Map<string, number>();
  counts.forEach((item) => {
    if (item.groupId) {
      countMap.set(item.groupId, parseInt(item.count, 10) || 0);
    }
  });

  // 轉換成樹狀階層結構
  const groupMap = new Map<string, any>();
  allGroups.forEach((g) => {
    groupMap.set(g.id, {
      ...g,
      testcaseCount: countMap.get(g.id) || 0,
      children: []
    });
  });

  const roots: any[] = [];
  groupMap.forEach((g) => {
    if (g.parent) {
      const parentNode = groupMap.get(g.parent.id);
      if (parentNode) {
        parentNode.children.push(g);
      } else {
        roots.push(g);
      }
    } else {
      roots.push(g);
    }
  });

  return c.json(roots);
});

groupRouter.post("/projects/:projectId/groups", async (c) => {
  const projectId = c.req.param("projectId");
  const { name, parentId, initCookies, initLocalStorage, variables } = await c.req.json();
  if (!name) return c.json({ error: "群組名稱為必填" }, 400);

  const project = await AppDataSource.getRepository(Project).findOne({
    where: { id: projectId },
  });
  if (!project) return c.json({ error: "找不到指定的專案" }, 404);

  const group = new TestGroup();
  group.name = name;
  group.project = project;
  group.initCookies = initCookies;
  group.initLocalStorage = initLocalStorage;
  group.variables = variables;

  const groupRepo = AppDataSource.getTreeRepository(TestGroup);

  if (parentId) {
    const parentGroup = await groupRepo.findOne({ where: { id: parentId } });
    if (!parentGroup) return c.json({ error: "找不到指定的父群組" }, 400);
    group.parent = parentGroup;
  }

  await groupRepo.save(group);
  return c.json(group, 201);
});

groupRouter.patch("/groups/:id", async (c) => {
  const id = c.req.param("id");
  const { name, parentId, initCookies, initLocalStorage, variables } = await c.req.json();

  const groupRepo = AppDataSource.getTreeRepository(TestGroup);
  const group = await groupRepo.findOne({
    where: { id },
    relations: { parent: true },
  });
  if (!group) return c.json({ error: "找不到群組" }, 404);

  if (parentId !== undefined) {
    if (parentId === null) {
      group.parent = null;
    } else {
      if (id === parentId) {
        return c.json({ error: "防環校驗失敗：父群組不能是自己" }, 400);
      }

      const newParent = await groupRepo.findOne({
        where: { id: parentId },
        relations: { parent: true },
      });
      if (!newParent) return c.json({ error: "找不到指定的父群組" }, 400);

      // 防環校驗：檢查新父群組的祖先鏈中是否包含當前群組
      const ancestors = await findAncestors(newParent, groupRepo);
      const isLoop = ancestors.some((ancestor) => ancestor.id === group.id);

      if (isLoop) {
        return c.json(
          {
            error:
              "防環校驗失敗：父群組不能是當前群組的子群組，這會造成循環嵌套",
          },
          400,
        );
      }

      group.parent = newParent;
    }
  }

  if (name) group.name = name;
  if (initCookies !== undefined) group.initCookies = initCookies;
  if (initLocalStorage !== undefined) group.initLocalStorage = initLocalStorage;
  if (variables !== undefined) group.variables = variables;

  await groupRepo.save(group);
  return c.json(group);
});

groupRouter.delete("/groups/:id", async (c) => {
  const id = c.req.param("id");
  const groupRepo = AppDataSource.getTreeRepository(TestGroup);
  const group = await groupRepo.findOne({ where: { id } });
  if (!group) return c.json({ error: "找不到群組" }, 404);

  await groupRepo.remove(group);
  return c.json({ message: "群組刪除成功" });
});
