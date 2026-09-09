import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import pg from "pg";
import { AppDataSource } from "../db.js";
import { Task } from "../entities/Task.js";
import { Project } from "../entities/Project.js";

export const taskRouter = new Hono();

// GET /tasks 全域任務歷史紀錄
taskRouter.get("/tasks", async (c) => {
  const tasks = await AppDataSource.getRepository(Task).find({
    relations: {
      runs: {
        testcase: {
          group: {
            project: true
          }
        }
      }
    },
    order: { createdAt: "DESC" },
    take: 100
  });

  const projects = await AppDataSource.getRepository(Project).find();
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  const formatted = tasks.map(t => {
    let projectId = "";
    let projectName = "未知專案";

    if (t.scope === "project") {
      projectId = t.scopeId;
      projectName = projectMap.get(t.scopeId) || "未知專案";
    } else {
      const firstRun = t.runs?.[0];
      const proj = firstRun?.testcase?.group?.project;
      if (proj) {
        projectId = proj.id;
        projectName = proj.name;
      }
    }

    const totalTokens = t.runs?.reduce((sum, r) => sum + (r.totalTokens || 0), 0) || 0;

    // 依 createdAt ASC 排序 runs，並映射為 TaskRun 摘要
    const runs = (t.runs || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((run) => ({
        runId: run.id,
        testcaseId: run.testcase?.id || null,
        testcaseName: run.testcase?.name || "未知案例",
        status: run.status,
      }));

    return {
      id: t.id,
      scope: t.scope,
      scopeId: t.scopeId,
      status: t.status,
      totalCount: t.totalCount,
      doneCount: t.doneCount,
      createdAt: t.createdAt,
      finishedAt: t.finishedAt,
      projectId,
      projectName,
      totalTokens,
      runs
    };
  });

  return c.json(formatted);
});

// 2.4 新增 GET /tasks/:taskId 端點
taskRouter.get("/tasks/:taskId", async (c) => {
  const taskId = c.req.param("taskId");
  const task = await AppDataSource.getRepository(Task).findOne({
    where: { id: taskId },
    relations: {
      runs: {
        testcase: true
      }
    }
  });

  if (!task) return c.json({ error: "找不到指定的批次任務" }, 404);

  const runs = task.runs.map(run => ({
    runId: run.id,
    testcaseId: run.testcase?.id || null,
    testcaseName: run.testcase?.name || "未知案例",
    status: run.status
  }));

  return c.json({
    id: task.id,
    scope: task.scope,
    scopeId: task.scopeId,
    status: task.status,
    totalCount: task.totalCount,
    doneCount: task.doneCount,
    createdAt: task.createdAt,
    finishedAt: task.finishedAt,
    runs
  });
});

// 2.5 新增 GET /tasks/:taskId/stream SSE 端點
taskRouter.get("/tasks/:taskId/stream", async (c) => {
  const taskId = c.req.param("taskId");

  const dbConfig = AppDataSource.options as any;
  const client = new pg.Client({
    connectionString:
      dbConfig.url ||
      `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
  });

  await client.connect();
  await client.query("LISTEN task_updates");

  return streamSSE(c, async (stream) => {
    client.on("notification", async (msg) => {
      if (msg.channel === "task_updates" && msg.payload) {
        try {
          const payload = JSON.parse(msg.payload);
          if (payload.taskId === taskId) {
            await stream.writeSSE({
              data: JSON.stringify(payload),
              event: "message",
            });
          }
        } catch (err: any) {
          console.error("[SSE Task] 解析資料庫通知 Payload 錯誤:", err.message);
        }
      }
    });

    stream.onAbort(async () => {
      console.log(`[SSE Task] 客戶端中斷任務 ${taskId} 的進度串流訂閱。`);
      try {
        await client.query("UNLISTEN task_updates");
        await client.end();
      } catch (e) {}
    });

    // 心跳包防逾時
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
      try {
        await stream.write(": heartbeat\n\n");
      } catch (err) {
        break;
      }
    }
  });
});

// 2.6 新增 GET /projects/:projectId/tasks 端點
taskRouter.get("/projects/:projectId/tasks", async (c) => {
  const projectId = c.req.param("projectId");
  
  const tasks = await AppDataSource.getRepository(Task)
    .createQueryBuilder("task")
    .where(qb => {
      const subQuery = qb.subQuery()
        .select("t.id")
        .from(Task, "t")
        .leftJoin("t.runs", "r")
        .leftJoin("r.testcase", "tc")
        .leftJoin("tc.group", "g")
        .where("t.scope = 'project' AND t.scopeId = :scopeId")
        .orWhere("g.projectId = :projectId")
        .getQuery();
      return "task.id IN " + subQuery;
    })
    .setParameter("scopeId", projectId)
    .setParameter("projectId", projectId)
    .orderBy("task.createdAt", "DESC")
    .getMany();

  return c.json(tasks);
});
