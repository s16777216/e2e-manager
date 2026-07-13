import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { Runnable } from "@langchain/core/runnables";
import { FailureSummarySchema } from "../graph/prompt.js";
import type { ModelSetting } from "../entities/ModelSetting.js";

/**
 * 依據 ModelSetting.provider 動態實例化並回傳 Executor 模型（已綁定工具）。
 * provider="google" → ChatGoogleGenerativeAI
 * 其他任何值       → ChatOpenAI（OpenAI Compatible 格式）
 */
export function getExecutorModel(modelSetting: ModelSetting, tools: any[]): Runnable {
  if (modelSetting.provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: modelSetting.model,
      temperature: 0.0,
      apiKey: modelSetting.apiKey || undefined,
    }).bindTools(tools);
  }

  return new ChatOpenAI({
    model: modelSetting.model || "gpt-4o",
    temperature: 0.0,
    apiKey: modelSetting.apiKey || "ollama",
    configuration: {
      baseURL: modelSetting.baseUrl || "http://localhost:11434/v1",
    },
  }).bindTools(tools);
}

/**
 * 依據 ModelSetting.provider 建立專用於失敗總結的 LLM 實例，
 * 不繫結工具，Temperature 設為 0.2。
 */
export function getSummarizerModel(modelSetting: ModelSetting): Runnable {
  if (modelSetting.provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: modelSetting.model,
      temperature: 0.2,
      apiKey: modelSetting.apiKey || undefined,
    }).withStructuredOutput(FailureSummarySchema, { includeRaw: true });
  }

  return new ChatOpenAI({
    model: modelSetting.model || "gpt-4o",
    temperature: 0.2,
    apiKey: modelSetting.apiKey || "ollama",
    configuration: {
      baseURL: modelSetting.baseUrl || "http://localhost:11434/v1",
    },
  }).withStructuredOutput(FailureSummarySchema, { includeRaw: true });
}
