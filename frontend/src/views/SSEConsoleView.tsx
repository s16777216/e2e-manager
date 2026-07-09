import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useSSEStream } from "../hooks/useSSEStream";
import type { Testcase } from "../types/api";
import { api } from "../lib/api";
import { StepAccordion } from "../components/custom/StepAccordion";
import { AIFailureSummaryPanel } from "../components/custom/AIFailureSummaryPanel";
import { cn } from "../lib/utils";

export default function SSEConsoleView() {
  const { runId } = useParams();

  // SSE 狀態連線
  const { runStatus } = useSSEStream(runId);

  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  const [testcase, setTestcase] = useState<Testcase | null>(null);

  useEffect(() => {
    if (!runStatus?.testcaseId) return;
    let active = true;
    api
      .getTestcaseDetail(runStatus.testcaseId)
      .then((data) => {
        if (active) {
          setTestcase(data);
        }
      })
      .catch((err) => {
        console.error("載入監控測試案例詳情失敗:", err);
      });
    return () => {
      active = false;
    };
  }, [runStatus?.testcaseId]);

  // 滾動至最新步驟
  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [runStatus?.steps]);

  return (
    <div className="flex-1 flex flex-col px-6 py-4">
      {/* 主日誌區 (單欄 Bento Style) */}
      <div className="flex-1 flex flex-col w-full space-y-6">
        {/* 視覺斷言報告 (當有最終結果時，顯示在上方) */}
        {runStatus &&
          ["passed", "failed", "error"].includes(runStatus.status) && (
            <div className="flex-shrink-0 animate-fadeIn mx-auto w-full">
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col gap-3.5 shadow-md",
                  runStatus.status === "passed"
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                    : runStatus.status === "error"
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                      : "bg-rose-950/20 border-rose-500/30 text-rose-400",
                )}
              >
                <div className="flex items-center gap-2">
                  {runStatus.status === "passed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                  <h4 className="text-sm font-bold">
                    結果 (
                    {runStatus.finalResult || runStatus.status.toUpperCase()})
                  </h4>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  {runStatus.finalReason ||
                    (runStatus.status === "error"
                      ? "測試執行發生嚴重異常"
                      : "測試未通過")}
                </p>
                {/* 新增：AI 失敗總結面板 */}
                {["failed", "error"].includes(runStatus.status) &&
                  runStatus.failureSummary && (
                    <AIFailureSummaryPanel summary={runStatus.failureSummary} />
                  )}
                {runStatus.totalTokens !== undefined &&
                  runStatus.totalTokens > 0 && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-zinc-800/40 text-[10px] text-zinc-400 font-mono">
                      {runStatus.asserterTotalTokens !== undefined &&
                        runStatus.asserterTotalTokens > 0 && (
                          <div>
                            <span>視覺斷言: </span>
                            <span className="text-zinc-300 font-semibold">
                              {runStatus.asserterTotalTokens}
                            </span>
                            <span className="text-zinc-500">
                              {" "}
                              (輸入:{runStatus.asserterPromptTokens} / 輸出:
                              {runStatus.asserterCompletionTokens})
                            </span>
                          </div>
                        )}
                      <div>
                        <span>總計消耗: </span>
                        <span className="text-indigo-400 font-bold">
                          {runStatus.totalTokens}
                        </span>
                        <span className="text-zinc-500">
                          {" "}
                          (輸入:{runStatus.totalPromptTokens} / 輸出:
                          {runStatus.totalCompletionTokens})
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        <div className="w-full mx-auto space-y-6">
          {!(runStatus?.steps && runStatus.steps.length > 0) &&
          !(runStatus?.testcaseSteps && runStatus.testcaseSteps.length > 0) &&
          !(testcase?.steps && testcase.steps.length > 0) ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-sm italic">正在準備測試步驟...</span>
            </div>
          ) : (
            <StepAccordion
              steps={runStatus?.steps || []}
              testcaseSteps={runStatus?.testcaseSteps || testcase?.steps || []}
            />
          )}

          {/* 如果任務失敗且有全域失敗截圖，但在步驟中沒顯示出來，可以在此處作為備份展示 */}
          {runStatus?.status === "failed" && runStatus.screenshotFailUrl && (
            <div className="mt-4 bg-zinc-900/20 border border-zinc-800 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase">
                <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                任務中斷/失敗截圖
              </h4>
              <div className="relative overflow-hidden rounded-lg border border-rose-900 bg-zinc-950 max-w-2xl">
                <img
                  src={runStatus.screenshotFailUrl}
                  alt="E2E Failure Screenshot"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}

          <div ref={timelineEndRef} />
        </div>
      </div>
    </div>
  );
}
