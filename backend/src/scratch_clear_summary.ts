import { AppDataSource } from "./db.js";

async function main() {
  await AppDataSource.initialize();
  console.log("[Scratch] Database initialized successfully.");
  const result = await AppDataSource.query(`UPDATE test_run SET "failureSummary" = NULL;`);
  console.log("[Scratch] SQL executed successfully. Result:", result);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("[Scratch] Error running SQL:", err);
  process.exit(1);
});
