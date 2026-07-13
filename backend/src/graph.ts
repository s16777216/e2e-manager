import { z } from "zod";
import { StateGraph, START, END } from "@langchain/langgraph";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { TestState } from "./state.js";
import { BrowserManager } from "./browser.js";
import { BrowserTools } from "./tools.js";
import { AppDataSource } from "./db.js";
import { TestRun } from "./entities/TestRun.js";
import { TestLog } from "./entities/TestLog.js";
import { TestRunStep } from "./entities/TestRunStep.js";
import {
  buildExecutorSystemPrompt,
  buildFailureSummarizerSystemPrompt,
} from "./graph/prompt.js";
import { routeAfterExecution, routeNextStep } from "./graph/router.js";
import { getSettings } from "./services/settingsService.js";
import { getExecutorModel, getSummarizerModel } from "./services/llmFactory.js";
import { Runnable } from "@langchain/core/runnables";
import { ClientTool, DynamicStructuredToolInput } from "@langchain/core/tools";

// 定義結構化視覺斷言 Zod Schema
const AssertionResultSchema = z.object({
  result: z
    .enum(["PASS", "FAIL"])
    .describe("判定結果，必須為 'PASS' 或 'FAIL'"),
  reason: z.string().describe("詳細的判斷理由與分析說明"),
});

function parseContentToString(content: any): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item)
          return item.text;
        return "";
      })
      .join("");
  }
  return "";
}

import { AiConfig } from "./services/settingsService.js";

export class E2EGraphBuilder {
  private browserManager: BrowserManager;
  private tools: ClientTool[];
  private model!: Runnable;
  private summarizer_model!: Runnable;
  private aiConfig!: AiConfig;

  /**
   * 使用靜態 create() 工廠方法取得實例，以便在建構子外進行非同步設定載入。
   */
  private constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
    this.tools = new BrowserTools(browserManager).getTools();
  }

  /**
   * 靜態工廠方法：從 DB 取得 aiConfig 設定後，動態初始化 Executor 與 Asserter 模型。
   */
  static async create(
    browserManager: BrowserManager,
  ): Promise<E2EGraphBuilder> {
    const instance = new E2EGraphBuilder(browserManager);
    try {
      const settings = await getSettings();
      const aiConfig = settings.aiConfig;
      instance.model = getExecutorModel(aiConfig, instance.tools);
      instance.summarizer_model = getSummarizerModel(aiConfig);
      instance.aiConfig = aiConfig;
      return instance;
    } catch (err) {
      console.error(
        "[E2EGraphBuilder] 讀取 AI 設定失敗，使用環境變數 fallback：",
        err,
      );
      throw err;
    }
  }

  /**
   * 初始化節點：將索引與狀態歸零
   */
  async initNode(state: typeof TestState.State) {
    return {
      current_step_idx: 0,
      step_retry_count: 0,
      screenshots_paths: [],
      logs: [],
    };
  }

  /**
   * 執行節點：負責擷取目前畫面、呼叫 Gemini 進行推理，並執行對應的 Playwright Tool Call
   */
  async executorNode(state: typeof TestState.State) {
    const idx = state.current_step_idx;
    const step_content = state.steps[idx];

    // 新增：在步驟開始時建立或載入 TestRunStep，狀態設為 running
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const testRunStepRepo = AppDataSource.getRepository(TestRunStep);
    const run = await testRunRepo.findOne({ where: { id: state.run_id } });
    if (run) {
      let stepRunEntity = await testRunStepRepo.findOne({
        where: { run: { id: run.id }, stepIdx: idx },
      });
      if (!stepRunEntity) {
        stepRunEntity = new TestRunStep();
        stepRunEntity.run = run;
        stepRunEntity.stepIdx = idx;
        stepRunEntity.stepDescription = step_content;
        stepRunEntity.status = "running";
        await testRunStepRepo.save(stepRunEntity);

        // 廣播 step_status 事件通知前端
        await testRunStepRepo.query(`SELECT pg_notify('test_run_logs', $1)`, [
          JSON.stringify({
            runId: run.id,
            stepIdx: idx,
            stepId: stepRunEntity.id,
            stepDescription: step_content,
            status: "running",
            event: "step_status",
            timestamp: new Date().toISOString(),
          }),
        ]);
      }
    }

    // 1. 框架預熱：呼叫 observeWebPage() 注入 ID、渲染貼紙、截圖、清除貼紙
    //    回傳帶有 ID 標籤的截圖與元素清單，一次傳給 LLM
    let screenshot_base64: string;
    let element_list: string;

    try {
      const observed = await this.browserManager.observeWebPage();
      screenshot_base64 = observed.screenshotBase64;
      element_list = observed.elementList;
    } catch (e: any) {
      // observeWebPage 失敗時 fallback 到純截圖
      screenshot_base64 = await this.browserManager.getPageScreenshotBase64();
      element_list = "（無法取得元素清單）";
    }

    const current_url = this.browserManager.page
      ? this.browserManager.page.url()
      : "";

    const step_expected = state.step_expecteds[idx] || "";

    // 2. 建構系統 Prompt
    const system_prompt = buildExecutorSystemPrompt({
      testName: state.test_name,
      stepIdx: idx,
      stepContent: step_content,
      stepExpected: step_expected,
      currentUrl: current_url,
    });

    // 2.5 取得當前步驟的歷史執行紀錄（包含工具呼叫與驗證失敗反饋）
    const stepLogs = (state.logs || []).filter((l) => l.step_idx === idx);
    let historyPrompt = "";
    if (stepLogs.length > 0) {
      historyPrompt =
        "\n\n# Execution History for the Current Step (Learn from failures/retries):\n" +
        stepLogs
          .map((log, i) => {
            return `Action ${i + 1}: ${log.action}\nResult/Feedback: ${log.result}`;
          })
          .join("\n\n");
    }

    // 3. 呼叫模型（使用帶貼紙的截圖 + 元素清單）
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage({
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${screenshot_base64}` },
          },
          {
            type: "text",
            text: `當前頁面已預先觀察完畢。截圖中的黃色數字標籤即為元素 ID。\n\n${element_list}\n\n請根據截圖中的標籤與元素清單，決定下一步要執行的工具。${historyPrompt}`,
          },
        ],
      }),
    ];

    const response = await this.model.invoke(messages);

    const tool_calls = response.tool_calls || [];
    const logs = [...(state.logs || [])];

    const prompt_tokens = response.usage_metadata?.input_tokens ?? 0;
    const completion_tokens = response.usage_metadata?.output_tokens ?? 0;
    const total_tokens = response.usage_metadata?.total_tokens ?? 0;

    // 4. 如果 AI 沒有呼叫工具，則記錄錯誤並增加重試次數
    if (tool_calls.length === 0) {
      logs.push({
        step_idx: idx,
        step_description: step_content,
        action: "none",
        result: "AI Agent 未呼召 any 工具，直接回覆文字說明",
        ai_response: parseContentToString(response.content),
        timestamp: new Date().toISOString(),
        prompt_tokens,
        completion_tokens,
        total_tokens,
      });
      return {
        logs,
        step_retry_count: state.step_retry_count + 1,
        last_screenshot: screenshot_base64,
        simplified_dom: element_list,
      };
    }

    // 5. 依序執行工具呼叫
    for (let i = 0; i < tool_calls.length; i++) {
      const tc = tool_calls[i];
      const tool_name = tc.name;
      const tool_args = tc.args;

      // 尋找對應的工具並執行
      const selected_tool = this.tools.find((t) => t.name === tool_name);
      const pTokens = i === 0 ? prompt_tokens : 0;
      const cTokens = i === 0 ? completion_tokens : 0;
      const tTokens = i === 0 ? total_tokens : 0;

      if (selected_tool) {
        const tool_result = await selected_tool.invoke(tool_args);
        logs.push({
          step_idx: idx,
          step_description: step_content,
          action: `${tool_name}(${JSON.stringify(tool_args)})`,
          result:
            typeof tool_result === "string"
              ? tool_result
              : JSON.stringify(tool_result),
          timestamp: new Date().toISOString(),
          prompt_tokens: pTokens,
          completion_tokens: cTokens,
          total_tokens: tTokens,
        });
      } else {
        logs.push({
          step_idx: idx,
          step_description: step_content,
          action: `unknown_tool: ${tool_name}`,
          result: "無法辨識的工具",
          timestamp: new Date().toISOString(),
          prompt_tokens: pTokens,
          completion_tokens: cTokens,
          total_tokens: tTokens,
        });
      }
    }

    return {
      logs,
      step_retry_count: state.step_retry_count + 1,
      last_screenshot: screenshot_base64,
      simplified_dom: element_list,
    };
  }

  /**
   * 記錄追蹤節點：當步驟完成時，將截圖存入資料庫並推進步驟索引
   */
  async stepTrackerNode(state: typeof TestState.State) {
    const idx = state.current_step_idx;

    // 取得與目前步驟相關的 logs
    const stepLogs = (state.logs || []).filter((l) => l.step_idx === idx);

    let stepPromptTokens = 0;
    let stepCompletionTokens = 0;
    let stepTotalTokens = 0;

    for (const log of stepLogs) {
      stepPromptTokens += log.prompt_tokens ?? 0;
      stepCompletionTokens += log.completion_tokens ?? 0;
      stepTotalTokens += log.total_tokens ?? 0;
    }

    // 擷取目前步驟完成時的截圖 Buffer
    let screenshotBuffer: Buffer | undefined;
    try {
      const base64 = await this.browserManager.getPageScreenshotBase64();
      screenshotBuffer = Buffer.from(base64, "base64");
    } catch (e: any) {
      console.error(`[E2E Manager] 擷取步驟完成畫面失敗: ${e.message}`);
    }

    // 將日誌與二進位截圖寫入資料庫
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const testRunStepRepo = AppDataSource.getRepository(TestRunStep);
    const testLogRepo = AppDataSource.getRepository(TestLog);

    const run = await testRunRepo.findOne({ where: { id: state.run_id } });
    if (run) {
      // 1. 尋找或建立當前步驟實體
      let stepRunEntity = await testRunStepRepo.findOne({
        where: { run: { id: run.id }, stepIdx: idx },
      });
      if (!stepRunEntity) {
        stepRunEntity = new TestRunStep();
        stepRunEntity.run = run;
        stepRunEntity.stepIdx = idx;
        stepRunEntity.stepDescription = state.steps[idx];
      }

      // 2. 更新步驟狀態、Token 及截圖
      stepRunEntity.status = "passed";
      stepRunEntity.promptTokens = stepPromptTokens;
      stepRunEntity.completionTokens = stepCompletionTokens;
      stepRunEntity.totalTokens = stepTotalTokens;
      if (screenshotBuffer) {
        stepRunEntity.screenshotData = screenshotBuffer;
      }
      await testRunStepRepo.save(stepRunEntity);

      // 3. 累加這一步的 Token 至 TestRun 最上層的總累計欄位
      run.totalPromptTokens = (run.totalPromptTokens || 0) + stepPromptTokens;
      run.totalCompletionTokens =
        (run.totalCompletionTokens || 0) + stepCompletionTokens;
      run.totalTokens = (run.totalTokens || 0) + stepTotalTokens;
      await testRunRepo.save(run);

      // 4. 寫入該步驟的所有操作日誌并關聯
      for (let i = 0; i < stepLogs.length; i++) {
        const log = stepLogs[i];
        const entity = new TestLog();
        entity.step = stepRunEntity;
        entity.action = log.action;
        entity.result = log.result;
        entity.aiResponse = log.ai_response;
        entity.promptTokens = log.prompt_tokens ?? 0;
        entity.completionTokens = log.completion_tokens ?? 0;
        entity.totalTokens = log.total_tokens ?? 0;

        await testLogRepo.save(entity);

        // 每寫入一筆日誌，就調用 NOTIFY 通知監聽者
        await testLogRepo.query(`SELECT pg_notify('test_run_logs', $1)`, [
          JSON.stringify({
            runId: run.id,
            stepIdx: idx,
            stepId: stepRunEntity.id,
            action: log.action,
            result: log.result,
            aiResponse: log.ai_response,
            logId: entity.id,
            event: "log",
            timestamp: new Date().toISOString(),
            promptTokens: entity.promptTokens,
            completionTokens: entity.completionTokens,
            totalTokens: entity.totalTokens,
          }),
        ]);
      }

      // 5. 廣播步驟更新通知 (passed)
      await testRunStepRepo.query(`SELECT pg_notify('test_run_logs', $1)`, [
        JSON.stringify({
          runId: run.id,
          stepIdx: idx,
          stepId: stepRunEntity.id,
          stepDescription: stepRunEntity.stepDescription,
          status: "passed",
          event: "step_status",
          totalTokens: stepRunEntity.totalTokens,
          timestamp: new Date().toISOString(),
        }),
      ]);
    }

    return {
      current_step_idx: idx + 1,
      step_retry_count: 0,
    };
  }

  /**
   * 報告節點：處理成功完成或失敗中斷時的安全寫入與收尾
   */
  async reporterNode(state: typeof TestState.State) {
    const update_data: any = {};
    const currentStepIdx = state.current_step_idx ?? 0;
    const steps = state.steps || [];

    // 如果測試尚未執行完所有步驟就被迫中斷 (例如重試超限)
    if (currentStepIdx < steps.length) {
      update_data.final_result = "FAIL";
      update_data.final_reason = `步驟 ${currentStepIdx + 1} (『${steps[currentStepIdx]}』) 執行次數達到上限但仍未完成，強制終止測試。`;
    } else {
      update_data.final_result = "PASS";
      update_data.final_reason = "所有測試步驟均已成功執行完畢。";
    }

    const merged_result = update_data.final_result || state.final_result;
    let screenshotFailBuffer: Buffer | undefined;

    if (["FAIL", "ERROR"].includes(merged_result) && this.browserManager.page) {
      try {
        const base64 = await this.browserManager.getPageScreenshotBase64();
        screenshotFailBuffer = Buffer.from(base64, "base64");
      } catch (e: any) {
        console.error(`[E2E Manager] 無法擷取最終失敗畫面：${e.message}`);
      }
    }

    // 確保關閉瀏覽器
    try {
      await this.browserManager.closeBrowser();
    } catch (e) {}

    // 更新資料庫中的 TestRun 與 TestRunStep 紀錄
    const testRunRepo = AppDataSource.getRepository(TestRun);
    const testRunStepRepo = AppDataSource.getRepository(TestRunStep);
    const testLogRepo = AppDataSource.getRepository(TestLog);

    const run = await testRunRepo.findOne({
      where: { id: state.run_id },
      relations: { testcase: true },
    });
    if (run) {
      // 1. 如果測試失敗，嘗試生成 AI 總結
      if (["FAIL", "ERROR"].includes(merged_result)) {
        try {
          const system_prompt = buildFailureSummarizerSystemPrompt({
            testName: state.test_name,
            expected: run.testcase?.expected || "未知",
            logs: state.logs || [],
          });

          const messages: BaseMessage[] = [new SystemMessage(system_prompt)];
          const sendScreenshot = this.aiConfig?.sendFailureScreenshot ?? true;
          if (screenshotFailBuffer && sendScreenshot) {
            messages.push(
              new HumanMessage({
                content: [
                  {
                    type: "text",
                    text: "這是測試失敗時的截圖：",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${screenshotFailBuffer.toString("base64")}`,
                    },
                  },
                ],
              }),
            );
          } else if (!sendScreenshot) {
            messages.push(new HumanMessage("設定已關閉傳送失敗截圖（使用非多模態模型）。"));
          } else {
            messages.push(new HumanMessage("無法提供失敗截圖。"));
          }

          const response = await this.summarizer_model.invoke(messages);

          console.log("response", response);

          const result = response.raw.content.at(0);

          if (result && result.type === "text") {
            run.failureSummary = JSON.parse(result.text);
          } else {
            run.failureSummary = {
              reason: "AI 總結生成出錯：無法解析的內容，請檢查輸出格式。",
              suggestion: `收到非預期的回應格式：${JSON.stringify(result)}`,
            };
          }
        } catch (e: any) {
          console.error(
            `[E2E Manager] AI 失敗總結失敗，採用 Fallback 物件: ${e.message}`,
          );
          run.failureSummary = {
            reason: `AI 總結生成出錯：${e.message}`,
            suggestion: "請手動檢查步驟日誌與執行截圖以進行排查。",
          };
        }
      }

      // 1. (舊邏輯) 如果步驟尚未跑完，說明最後一步失敗了。更新當前步驟為 failed，並補存相關 logs。
      if (currentStepIdx < steps.length) {
        let stepRunEntity = await testRunStepRepo.findOne({
          where: { run: { id: run.id }, stepIdx: currentStepIdx },
        });
        if (!stepRunEntity) {
          stepRunEntity = new TestRunStep();
          stepRunEntity.run = run;
          stepRunEntity.stepIdx = currentStepIdx;
          stepRunEntity.stepDescription = steps[currentStepIdx];
        }

        // 篩選與當前失敗步驟相關的記憶體 logs
        let stepLogs = (state.logs || []).filter(
          (l) => l.step_idx === currentStepIdx,
        );

        // 如果完全無日誌則自動補充一筆虛擬日誌
        if (stepLogs.length === 0) {
          stepLogs.push({
            step_idx: currentStepIdx,
            step_description: steps[currentStepIdx],
            action: "error",
            result: "步驟超限未完成",
            timestamp: new Date().toISOString(),
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          });
        }

        let stepPromptTokens = 0;
        let stepCompletionTokens = 0;
        let stepTotalTokens = 0;
        for (const log of stepLogs) {
          stepPromptTokens += log.prompt_tokens ?? 0;
          stepCompletionTokens += log.completion_tokens ?? 0;
          stepTotalTokens += log.total_tokens ?? 0;
        }

        // 寫入/更新步驟狀態為 failed
        stepRunEntity.status = "failed";
        stepRunEntity.promptTokens = stepPromptTokens;
        stepRunEntity.completionTokens = stepCompletionTokens;
        stepRunEntity.totalTokens = stepTotalTokens;
        if (screenshotFailBuffer) {
          stepRunEntity.screenshotData = screenshotFailBuffer;
        }
        await testRunStepRepo.save(stepRunEntity);

        // 累加 Token 到 TestRun 總數
        run.totalPromptTokens = (run.totalPromptTokens || 0) + stepPromptTokens;
        run.totalCompletionTokens =
          (run.totalCompletionTokens || 0) + stepCompletionTokens;
        run.totalTokens = (run.totalTokens || 0) + stepTotalTokens;

        // 寫入當前失敗步驟的所有 TestLog 並與該步驟關聯
        for (const log of stepLogs) {
          const entity = new TestLog();
          entity.step = stepRunEntity;
          entity.action = log.action;
          entity.result = log.result;
          entity.aiResponse = log.ai_response;
          entity.promptTokens = log.prompt_tokens ?? 0;
          entity.completionTokens = log.completion_tokens ?? 0;
          entity.totalTokens = log.total_tokens ?? 0;
          await testLogRepo.save(entity);

          // 廣播操作日誌
          await testLogRepo.query(`SELECT pg_notify('test_run_logs', $1)`, [
            JSON.stringify({
              runId: run.id,
              stepIdx: currentStepIdx,
              stepId: stepRunEntity.id,
              action: log.action,
              result: log.result,
              aiResponse: log.ai_response,
              logId: entity.id,
              event: "log",
              timestamp: new Date().toISOString(),
              promptTokens: entity.promptTokens,
              completionTokens: entity.completionTokens,
              totalTokens: entity.totalTokens,
            }),
          ]);
        }

        // 廣播步驟更新通知 (failed)
        await testRunStepRepo.query(`SELECT pg_notify('test_run_logs', $1)`, [
          JSON.stringify({
            runId: run.id,
            stepIdx: currentStepIdx,
            stepId: stepRunEntity.id,
            stepDescription: stepRunEntity.stepDescription,
            status: "failed",
            event: "step_status",
            totalTokens: stepRunEntity.totalTokens,
            timestamp: new Date().toISOString(),
          }),
        ]);
      }

      // 2. 更新 TestRun 屬性
      const statusValue =
        merged_result === "PASS"
          ? "passed"
          : merged_result === "ERROR"
            ? "error"
            : "failed";
      run.status = statusValue;
      run.finalResult = merged_result;
      run.finalReason = update_data.final_reason || state.final_reason;
      run.finishedAt = new Date();
      if (screenshotFailBuffer) {
        run.screenshotFailData = screenshotFailBuffer;
      }
      await testRunRepo.save(run);

      // 3. 發送任務結束通知 (包含 failureSummary)
      await testRunRepo.query(`SELECT pg_notify('test_run_logs', $1)`, [
        JSON.stringify({
          runId: state.run_id,
          status: run.status,
          finalResult: merged_result,
          finalReason: run.finalReason,
          failureSummary: run.failureSummary,
          event: "completed",
          timestamp: new Date().toISOString(),
          totalPromptTokens: run.totalPromptTokens,
          totalCompletionTokens: run.totalCompletionTokens,
          totalTokens: run.totalTokens,
        }),
      ]);
    }

    return update_data;
  }

  buildGraph() {
    const workflow = new StateGraph(TestState)
      // 加入節點
      .addNode("init", this.initNode.bind(this))
      .addNode("executor", this.executorNode.bind(this))
      .addNode("step_tracker", this.stepTrackerNode.bind(this))
      .addNode("reporter", this.reporterNode.bind(this))

      // 設定起始點
      .addEdge(START, "init")
      .addEdge("init", "executor")

      // 執行後的條件邊
      .addConditionalEdges("executor", routeAfterExecution as any, {
        executor: "executor",
        step_tracker: "step_tracker",
        reporter: "reporter",
      })

      // 步驟追蹤後的條件邊
      .addConditionalEdges("step_tracker", routeNextStep as any, {
        executor: "executor",
        reporter: "reporter",
      })

      // 最終邊
      .addEdge("reporter", END);

    return workflow.compile();
  }
}
