import { DataSource } from "typeorm";
import { AppDataSource } from "../db.js";

export interface TableStorageMetric {
  tableName: string;
  sizeBytes: number;
  size: string;
}

export interface ScreenshotMetrics {
  sizeBytes: number;
  size: string;
  count: number;
  percentage: number;
}

export interface DatabaseStorageMetrics {
  databaseSizeBytes: number;
  databaseSize: string;
  screenshots: ScreenshotMetrics;
  tables: TableStorageMetric[];
}

/**
 * 將位元組（Bytes）格式化為人類可讀字串（如 "142.5 MB", "12.0 KB", "0 B"）
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes <= 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * 查詢目前 PostgreSQL 資料庫實體空間與步驟/失敗截圖二進位佔用指標
 */
export async function getDatabaseStorageMetrics(
  dataSource: Pick<DataSource, "query"> = AppDataSource
): Promise<DatabaseStorageMetrics> {
  // 1. 查詢資料庫整體實體佔用大小
  interface RawDbSizeRow {
    size_bytes?: string | number | null;
  }
  const dbSizeRes = (await dataSource.query(
    "SELECT pg_database_size(current_database()) AS size_bytes;"
  )) as RawDbSizeRow[] | undefined;
  const databaseSizeBytes = parseInt(String(dbSizeRes?.[0]?.size_bytes ?? "0"), 10) || 0;

  // 2. 統計步驟截圖 (test_run_step.screenshotData) 與失敗截圖 (test_run.screenshotFailData)
  let screenshotBytes = 0;
  let screenshotCount = 0;

  interface RawScreenshotRow {
    bytes?: string | number | null;
    count?: string | number | null;
  }

  try {
    const screenshotRes = (await dataSource.query(`
      SELECT 
        (
          COALESCE((SELECT SUM(octet_length("screenshotData")) FROM test_run_step WHERE "screenshotData" IS NOT NULL), 0) +
          COALESCE((SELECT SUM(octet_length("screenshotFailData")) FROM test_run WHERE "screenshotFailData" IS NOT NULL), 0)
        ) AS bytes,
        (
          COALESCE((SELECT COUNT(*) FROM test_run_step WHERE "screenshotData" IS NOT NULL), 0) +
          COALESCE((SELECT COUNT(*) FROM test_run WHERE "screenshotFailData" IS NOT NULL), 0)
        ) AS count;
    `)) as RawScreenshotRow[] | undefined;

    if (screenshotRes && screenshotRes[0]) {
      screenshotBytes = parseInt(String(screenshotRes[0].bytes ?? "0"), 10) || 0;
      screenshotCount = parseInt(String(screenshotRes[0].count ?? "0"), 10) || 0;
    }
  } catch (err: unknown) {
    // 若表格尚未同步至資料庫，優雅容錯為 0
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("does not exist")) {
      throw err;
    }
  }

  const percentage = databaseSizeBytes > 0
    ? Math.min(100, parseFloat(((screenshotBytes / databaseSizeBytes) * 100).toFixed(1)))
    : 0;

  // 3. 查詢主要資料表實體佔用排行 (pg_total_relation_size 涵蓋 table, toast, index)
  interface RawTableRow {
    tableName: string;
    sizeBytes: string | number;
  }

  let tables: TableStorageMetric[] = [];
  try {
    const tablesRes = (await dataSource.query(`
      SELECT 
        c.relname AS "tableName",
        pg_total_relation_size(c.oid) AS "sizeBytes"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname IN ('test_run_step', 'test_log', 'test_run', 'testcase')
      ORDER BY "sizeBytes" DESC;
    `)) as RawTableRow[] | undefined;

    tables = (tablesRes || []).map((row) => {
      const bytes = parseInt(String(row.sizeBytes), 10) || 0;
      return {
        tableName: row.tableName,
        sizeBytes: bytes,
        size: formatBytes(bytes),
      };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("does not exist")) {
      throw err;
    }
  }
  return {
    databaseSizeBytes,
    databaseSize: formatBytes(databaseSizeBytes),
    screenshots: {
      sizeBytes: screenshotBytes,
      size: formatBytes(screenshotBytes),
      count: screenshotCount,
      percentage,
    },
    tables,
  };
}
