import { AppDataSource, initDB } from "../src/db.js";
import { Project } from "../src/entities/Project.js";
import { Testcase } from "../src/entities/Testcase.js";

async function run() {
  await initDB();

  const projects = await AppDataSource.getRepository(Project).find();
  console.log("Projects:", projects.map(p => ({ id: p.id, name: p.name })));

  const counts = await AppDataSource.getRepository(Testcase)
    .createQueryBuilder("tc")
    .innerJoin("tc.group", "g")
    .select("g.projectId", "projectId")
    .addSelect("COUNT(*)", "count")
    .groupBy("g.projectId")
    .getRawMany();

  console.log("Counts raw:", counts);

  const countMap = new Map<string, number>();
  counts.forEach((item) => {
    if (item.projectId) {
      countMap.set(item.projectId, parseInt(item.count, 10) || 0);
    }
  });

  const projectsWithCount = projects.map((p) => ({
    id: p.id,
    name: p.name,
    testcaseCount: countMap.get(p.id) || 0,
  }));

  console.log("Projects with counts:", projectsWithCount);

  await AppDataSource.destroy();
}

run().catch(console.error);
