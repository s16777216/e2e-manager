import { describe, it, expect } from "vitest";
import { buildExecutorSystemPrompt, buildAsserterSystemPrompt } from "../src/graph/prompt.js";
import { routeAfterExecution, routeNextStep } from "../src/graph/router.js";
import { LogEntry } from "../src/state.js";

describe("狀態機 Prompt 拼接與條件路由單元測試", () => {
  describe("Prompt 拼接 (prompt.ts)", () => {
    it("1. buildExecutorSystemPrompt 應正確渲染測試案例、步驟與當前網址", () => {
      const prompt = buildExecutorSystemPrompt({
        testName: "會員註冊功能測試",
        stepIdx: 1,
        stepContent: "點擊同意服務條款",
        currentUrl: "https://example.com/register"
      });

      expect(prompt).toContain("會員註冊功能測試");
      expect(prompt).toContain("Current Step (2)");
      expect(prompt).toContain("點擊同意服務條款");
      expect(prompt).toContain("https://example.com/register");
      expect(prompt).not.toContain("- Step Expected Outcome:");
    });

    it("1b. buildExecutorSystemPrompt 應正確渲染步驟預期結果 (若存在)", () => {
      const prompt = buildExecutorSystemPrompt({
        testName: "會員註冊功能測試",
        stepIdx: 1,
        stepContent: "點擊同意服務條款",
        stepExpected: "看到同意成功提示",
        currentUrl: "https://example.com/register"
      });

      expect(prompt).toContain("Step Expected Outcome: \"看到同意成功提示\"");
      expect(prompt).toContain("5. DONE ACTING & EXPECTED OUTCOMES");
    });

    it("2. buildAsserterSystemPrompt 應正確渲染斷言資訊", () => {
      const prompt = buildAsserterSystemPrompt({
        testName: "購物車結帳測試",
        expected: "顯示訂單成立與交易序號"
      });

      expect(prompt).toContain("購物車結帳測試");
      expect(prompt).toContain("顯示訂單成立與交易序號");
    });
  });

  describe("條件路由邏輯 (router.ts)", () => {
    it("3. routeAfterExecution: 沒有日誌時應回傳 executor 繼續執行", () => {
      const result = routeAfterExecution({
        logs: [],
        step_retry_count: 0,
        current_step_idx: 0,
        step_expecteds: []
      });
      expect(result).toBe("executor");
    });

    it("4a. routeAfterExecution: 無預期結果時呼叫 done_acting 應路由至 step_tracker 推進步驟", () => {
      const result = routeAfterExecution({
        logs: [
          {
            step_idx: 0,
            step_description: "點擊按鈕",
            action: "done_acting()",
            result: "Done",
            timestamp: new Date().toISOString()
          }
        ],
        step_retry_count: 1,
        current_step_idx: 0,
        step_expecteds: [""]
      });
      expect(result).toBe("step_tracker");
    });

    it("4b. routeAfterExecution: 有預期結果時呼叫 done_acting 也應路由至 step_tracker", () => {
      const result = routeAfterExecution({
        logs: [
          {
            step_idx: 0,
            step_description: "點擊登入按鈕",
            action: "done_acting()",
            result: "Done",
            timestamp: new Date().toISOString()
          }
        ],
        step_retry_count: 1,
        current_step_idx: 0,
        step_expecteds: ["顯示儀表板"]
      });
      expect(result).toBe("step_tracker");
    });

    it("5. routeAfterExecution: 單步重試達到 5 次且未呼叫 done_acting 時應路由至 reporter 失敗中斷", () => {
      const result = routeAfterExecution({
        logs: [
          {
            step_idx: 0,
            step_description: "找不到按鈕",
            action: "click()",
            result: "Element not found",
            timestamp: new Date().toISOString()
          }
        ],
        step_retry_count: 5,
        current_step_idx: 0,
        step_expecteds: []
      });
      expect(result).toBe("reporter");
    });

    it("6. routeNextStep: 當前步驟索引小於總步驟時應回傳 executor", () => {
      const result = routeNextStep({
        current_step_idx: 1,
        steps: ["第一步", "第二步"]
      });
      expect(result).toBe("executor");
    });

    it("7. routeNextStep: 當前步驟索引達到或大於總步驟時應回傳 reporter 進行收尾報告", () => {
      const result = routeNextStep({
        current_step_idx: 2,
        steps: ["第一步", "第二步"]
      });
      expect(result).toBe("reporter");
    });
  });
});
