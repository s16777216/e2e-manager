import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import type { AiConfig } from "./settingsService.js";
import { Runnable } from "@langchain/core/runnables";
import { FailureSummarySchema } from "../graph/prompt.js";

/**
 * 依據 aiConfig.provider 動態實例化並回傳 Executor 模型（已綁定工具）。
 * provider="google" → ChatGoogleGenerativeAI
 * 其他任何值   → ChatOpenAI（OpenAI Compatible 格式）
 */
export function getExecutorModel(aiConfig: AiConfig, tools: any[]): Runnable {
  if (aiConfig.executorProvider === "google") {
    return new ChatGoogleGenerativeAI({
      model: aiConfig.geminiModel,
      temperature: 0.0,
      apiKey: aiConfig.apiKey || undefined,
    }).bindTools(tools);
  }

  return new ChatOpenAI({
    model: aiConfig.openaiModel || "gpt-4o",
    temperature: 0.0,
    apiKey: aiConfig.openaiApiKey || "ollama",
    configuration: {
      baseURL: aiConfig.baseUrl || "http://localhost:11434/v1",
    },
  }).bindTools(tools);
}

/**
 * 依據 aiConfig.provider 建立專用於失敗總結的 LLM 實例，
 * 不繫結工具，Temperature 設為 0.2。
 */
export function getSummarizerModel(aiConfig: AiConfig): Runnable {
  if (aiConfig.provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: aiConfig.summarizerGeminiModel || aiConfig.geminiModel || "gemini-2.0-flash",
      temperature: 0.2,
      apiKey: aiConfig.apiKey || undefined,
    }).withStructuredOutput(FailureSummarySchema, { includeRaw: true });
  }

  return new ChatOpenAI({
    model: aiConfig.summarizerOpenaiModel || aiConfig.openaiModel || "gpt-4o",
    temperature: 0.2,
    apiKey: aiConfig.openaiApiKey || "ollama",
    configuration: {
      baseURL: aiConfig.baseUrl || "http://localhost:11434/v1",
    },
  }).withStructuredOutput(FailureSummarySchema, { includeRaw: true });
}
