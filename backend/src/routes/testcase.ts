import { Hono } from "hono";
import { AppDataSource } from "../db.js";
import { Testcase } from "../entities/Testcase.js";
import { TestGroup } from "../entities/TestGroup.js";
import { TestcaseStep } from "../entities/TestcaseStep.js";

export const testcaseRouter = new Hono();

testcaseRouter.get("/groups/:groupId/testcases", async (c) => {
  const groupId = c.req.param("groupId");
  const testcases = await AppDataSource.getRepository(Testcase).find({
    where: { group: { id: groupId } },
    relations: { runs: true, steps: true },
    order: {
      steps: {
        stepIdx: "ASC",
      },
      runs: {
        createdAt: "ASC",
      },
    },
  });
  return c.json(testcases);
});

testcaseRouter.post("/groups/:groupId/testcases", async (c) => {
  const groupId = c.req.param("groupId");
  const { name, steps, expected, initCookies, initLocalStorage, variables } =
    await c.req.json();

  if (!name) {
    return c.json({ error: "無效的欄位：name 為必填" }, 400);
  }
  if (steps !== undefined && !Array.isArray(steps)) {
    return c.json({ error: "無效的欄位：steps 必須為陣列" }, 400);
  }

  const group = await AppDataSource.getRepository(TestGroup).findOne({
    where: { id: groupId },
  });
  if (!group) return c.json({ error: "找不到指定的群組" }, 404);

  const testcase = new Testcase();
  testcase.name = name;
  testcase.expected = expected ?? "";
  testcase.group = group;
  testcase.initCookies = initCookies;
  testcase.initLocalStorage = initLocalStorage;
  testcase.variables = variables;

  // 轉換成 TestcaseStep 實體
  testcase.steps = (steps ?? []).map((s: any, idx: number) => {
    const step = new TestcaseStep();
    step.stepIdx = idx;
    step.action = typeof s === "string" ? s : s.action;
    step.expected = typeof s === "string" ? undefined : s.expected || undefined;
    step.hasExpected = typeof s === "string" ? false : !!s.hasExpected;
    return step;
  });

  await AppDataSource.getRepository(Testcase).save(testcase);
  return c.json(testcase, 201);
});

testcaseRouter.get("/testcases/:id", async (c) => {
  const id = c.req.param("id");
  const testcase = await AppDataSource.getRepository(Testcase).findOne({
    where: { id },
    relations: { runs: true, steps: true },
    order: {
      steps: {
        stepIdx: "ASC",
      },
      runs: {
        createdAt: "ASC",
      },
    },
  });
  if (!testcase) return c.json({ error: "找不到測試案例" }, 404);
  return c.json(testcase);
});

testcaseRouter.patch("/testcases/:id", async (c) => {
  const id = c.req.param("id");
  const { name, steps, expected, initCookies, initLocalStorage, variables } =
    await c.req.json();

  const testcaseRepo = AppDataSource.getRepository(Testcase);
  const testcase = await testcaseRepo.findOne({
    where: { id },
    relations: { steps: true },
  });
  if (!testcase) return c.json({ error: "找不到測試案例" }, 404);

  if (steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return c.json({ error: "steps 必須為非空陣列" }, 400);
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // 1. 先刪除該案例舊有的 steps 紀錄
      await transactionalEntityManager.delete(TestcaseStep, {
        testcase: { id },
      });

      // 2. 建立新 steps 實體
      const stepsEntities = steps.map((s: any, idx: number) => {
        const step = new TestcaseStep();
        step.testcase = testcase;
        step.stepIdx = idx;
        step.action = typeof s === "string" ? s : s.action;
        step.expected =
          typeof s === "string" ? undefined : s.expected || undefined;
        step.hasExpected = typeof s === "string" ? false : !!s.hasExpected;
        return step;
      });

      // 3. 更新 testcase 其他欄位並儲存
      testcase.name = name;
      testcase.expected = expected;
      testcase.initCookies = initCookies;
      testcase.initLocalStorage = initLocalStorage;
      testcase.variables = variables;
      testcase.steps = stepsEntities;

      await transactionalEntityManager.save(testcase);
    });
  } else {
    testcase.name = name;
    testcase.expected = expected;
    testcase.initCookies = initCookies;
    testcase.initLocalStorage = initLocalStorage;
    testcase.variables = variables;
    await testcaseRepo.save(testcase);
  }

  // 重新獲取更新後且排序好的測試案例回傳
  const updatedTestcase = await testcaseRepo.findOne({
    where: { id },
    relations: { runs: true, steps: true },
    order: {
      steps: {
        stepIdx: "ASC",
      },
      runs: {
        createdAt: "ASC",
      },
    },
  });

  return c.json(updatedTestcase);
});

testcaseRouter.delete("/testcases/:id", async (c) => {
  const id = c.req.param("id");
  const testcaseRepo = AppDataSource.getRepository(Testcase);
  const testcase = await testcaseRepo.findOne({ where: { id } });
  if (!testcase) return c.json({ error: "找不到測試案例" }, 404);

  await testcaseRepo.remove(testcase);
  return c.json({ message: "測試案例刪除成功" });
});
