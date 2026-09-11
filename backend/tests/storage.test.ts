import { describe, it, expect, vi } from "vitest";
import { formatBytes, getDatabaseStorageMetrics } from "../src/services/storageService.js";
import { settingsRouter } from "../src/routes/settings.js";
import * as storageService from "../src/services/storageService.js";

describe("儲存指標服務與格式化單元測試", () => {
  describe("formatBytes 函式", () => {
    it("0 位元組或負數/非數字應回傳 0 B", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(-100)).toBe("0 B");
      expect(formatBytes(NaN)).toBe("0 B");
    });

    it("小於 1024 位元組應回傳 B", () => {
      expect(formatBytes(1)).toBe("1 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1023)).toBe("1023 B");
    });

    it("KB 級別轉換正確", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(2048)).toBe("2 KB");
    });

    it("MB 級別轉換正確", () => {
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(149422080)).toBe("142.5 MB");
    });

    it("GB 與 TB 級別轉換正確", () => {
      expect(formatBytes(1073741824)).toBe("1 GB");
      expect(formatBytes(1099511627776)).toBe("1 TB");
    });
  });

  describe("getDatabaseStorageMetrics 核心邏輯", () => {
    it("場景 A：正常資料庫，包含截圖與資料表大小，能正確計算指標與百分比", async () => {
      const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("pg_database_size")) {
          return [{ size_bytes: "104857600" }]; // 100 MB
        }
        if (sql.includes("pg_total_relation_size")) {
          return [
            { tableName: "test_run_step", sizeBytes: "31457280" }, // 30 MB
            { tableName: "test_log", sizeBytes: "20971520" },      // 20 MB
            { tableName: "test_run", sizeBytes: "10485760" },      // 10 MB
            { tableName: "testcase", sizeBytes: "5242880" },       // 5 MB
          ];
        }
        if (sql.includes("octet_length")) {
          return [{ bytes: "26214400", count: "50" }]; // 25 MB, 50 screenshots
        }
        return [];
      });

      const mockDataSource = { query: mockQuery };
      const metrics = await getDatabaseStorageMetrics(mockDataSource);

      expect(metrics.databaseSizeBytes).toBe(104857600);
      expect(metrics.databaseSize).toBe("100 MB");

      expect(metrics.screenshots.sizeBytes).toBe(26214400);
      expect(metrics.screenshots.size).toBe("25 MB");
      expect(metrics.screenshots.count).toBe(50);
      expect(metrics.screenshots.percentage).toBe(25); // 25 MB / 100 MB = 25%

      expect(metrics.tables).toHaveLength(4);
      expect(metrics.tables[0]).toEqual({
        tableName: "test_run_step",
        sizeBytes: 31457280,
        size: "30 MB",
      });
      expect(metrics.tables[1]).toEqual({
        tableName: "test_log",
        sizeBytes: 20971520,
        size: "20 MB",
      });
    });

    it("場景 B：空資料庫或無截圖時，能安全回傳 0 值與 0% 且不發生除以零錯誤", async () => {
      const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("pg_database_size")) {
          return [{ size_bytes: "8388608" }]; // 8 MB
        }
        if (sql.includes("pg_total_relation_size")) {
          return [];
        }
        if (sql.includes("octet_length")) {
          return [{ bytes: "0", count: "0" }];
        }
        return [];
      });

      const mockDataSource = { query: mockQuery };
      const metrics = await getDatabaseStorageMetrics(mockDataSource);

      expect(metrics.databaseSizeBytes).toBe(8388608);
      expect(metrics.databaseSize).toBe("8 MB");
      expect(metrics.screenshots.sizeBytes).toBe(0);
      expect(metrics.screenshots.size).toBe("0 B");
      expect(metrics.screenshots.count).toBe(0);
      expect(metrics.screenshots.percentage).toBe(0);
      expect(metrics.tables).toHaveLength(0);
    });

    it("場景 C：當表格尚未同步至資料庫時（does not exist），應優雅容錯回傳預設值", async () => {
      const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("pg_database_size")) {
          return [{ size_bytes: "5000000" }];
        }
        if (sql.includes("test_run_step")) {
          throw new Error('relation "test_run_step" does not exist');
        }
        if (sql.includes("pg_total_relation_size")) {
          throw new Error('relation "pg_class" does not exist');
        }
        return [];
      });

      const mockDataSource = { query: mockQuery };
      const metrics = await getDatabaseStorageMetrics(mockDataSource);

      expect(metrics.databaseSizeBytes).toBe(5000000);
      expect(metrics.screenshots.sizeBytes).toBe(0);
      expect(metrics.screenshots.count).toBe(0);
      expect(metrics.screenshots.percentage).toBe(0);
      expect(metrics.tables).toHaveLength(0);
    });

    it("場景 D：資料庫連線中斷等非預期錯誤，應正確拋出例外", async () => {
      const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("pg_database_size")) {
          throw new Error("Connection terminated unexpectedly");
        }
        return [];
      });

      const mockDataSource = { query: mockQuery };
      await expect(getDatabaseStorageMetrics(mockDataSource)).rejects.toThrow(
        "Connection terminated unexpectedly"
      );
    });
  });

  describe("API 路由 GET /api/settings/storage", () => {
    it("成功時回傳 200 及統計指標 JSON", async () => {
      const mockMetrics: storageService.DatabaseStorageMetrics = {
        databaseSizeBytes: 50000000,
        databaseSize: "47.7 MB",
        screenshots: {
          sizeBytes: 10000000,
          size: "9.5 MB",
          count: 20,
          percentage: 20,
        },
        tables: [
          { tableName: "test_run_step", sizeBytes: 15000000, size: "14.3 MB" },
        ],
      };

      const spy = vi
        .spyOn(storageService, "getDatabaseStorageMetrics")
        .mockResolvedValueOnce(mockMetrics);

      const res = await settingsRouter.request("/settings/storage");
      expect(res.status).toBe(200);

      const data = (await res.json()) as storageService.DatabaseStorageMetrics;
      expect(data.databaseSize).toBe("47.7 MB");
      expect(data.screenshots.count).toBe(20);
      expect(data.screenshots.percentage).toBe(20);
      expect(data.tables).toHaveLength(1);

      spy.mockRestore();
    });

    it("發生錯誤時回傳 500 及明確錯誤訊息", async () => {
      const spy = vi
        .spyOn(storageService, "getDatabaseStorageMetrics")
        .mockRejectedValueOnce(new Error("資料庫查詢超時"));

      const res = await settingsRouter.request("/settings/storage");
      expect(res.status).toBe(500);

      interface ErrorResponse {
        error: string;
      }
      const data = (await res.json()) as ErrorResponse;
      expect(data.error).toContain("獲取資料庫儲存空間指標失敗: 資料庫查詢超時");

      spy.mockRestore();
    });
  });
});
