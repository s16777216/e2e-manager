import React from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, XCircle, Search, Lightbulb } from "lucide-react";

interface AIFailureSummaryPanelProps {
  summary: string;
}

export const AIFailureSummaryPanel: React.FC<AIFailureSummaryPanelProps> = ({
  summary,
}) => {
  // 解析失敗總結為結構化內容
  const parseSummary = (text: string) => {
    const stepRegex = /(?:1\.\s*❌\s*\*\*失敗步驟\*\*：|❌\s*\*\*失敗步驟\*\*：)([\s\S]*?)(?=(?:2\.\s*🔍\s*\*\*根本原因分析\*\*：|🔍\s*\*\*根本原因分析\*\*：|3\.\s*💡\s*\*\*修復建議\*\*：|💡\s*\*\*修復建議\*\*：|$))/;
    const reasonRegex = /(?:2\.\s*🔍\s*\*\*根本原因分析\*\*：|🔍\s*\*\*根本原因分析\*\*：)([\s\S]*?)(?=(?:1\.\s*❌\s*\*\*失敗步驟\*\*：|❌\s*\*\*失敗步驟\*\*：|3\.\s*💡\s*\*\*修復建議\*\*：|💡\s*\*\*修復建議\*\*：|$))/;
    const suggestionRegex = /(?:3\.\s*💡\s*\*\*修復建議\*\*：|💡\s*\*\*修復建議\*\*：)([\s\S]*?)(?=(?:1\.\s*❌\s*\*\*失敗步驟\*\*：|❌\s*\*\*失敗步驟\*\*：|2\.\s*🔍\s*\*\*根本原因分析\*\*：|🔍\s*\*\*根本原因分析\*\*：|$))/;

    const step = text.match(stepRegex)?.[1]?.trim() || "";
    const reason = text.match(reasonRegex)?.[1]?.trim() || "";
    const suggestion = text.match(suggestionRegex)?.[1]?.trim() || "";

    return { step, reason, suggestion };
  };

  const { step, reason, suggestion } = parseSummary(summary);
  const isParsed = step || reason || suggestion;

  return (
    <div className="bg-rose-950/10 backdrop-blur-sm border border-rose-500/20 rounded-2xl p-6 my-5 shadow-lg shadow-rose-950/20">
      <div className="flex items-center gap-2.5 mb-5 text-rose-300">
        <AlertCircle className="w-5 h-5 text-rose-400" />
        <h3 className="text-base font-bold tracking-wide">AI 失敗原因診斷</h3>
      </div>

      {isParsed ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 失敗步驟 Bento 卡片 */}
          {step && (
            <div className="bg-rose-950/20 border border-rose-500/10 rounded-xl p-4.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase">
                <XCircle className="w-4 h-4 text-rose-500" />
                失敗步驟
              </div>
              <div className="text-rose-200/90 text-xs leading-relaxed font-medium">
                <ReactMarkdown>{step}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* 根本原因 Bento 卡片 */}
          {reason && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-zinc-400 font-semibold text-xs tracking-wider uppercase">
                <Search className="w-4 h-4 text-indigo-400" />
                根本原因分析
              </div>
              <div className="text-zinc-300/90 text-xs leading-relaxed font-medium">
                <ReactMarkdown>{reason}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* 修復建議 Bento 卡片 (跨兩欄) */}
          {suggestion && (
            <div className="col-span-1 md:col-span-2 bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                修復與改善建議
              </div>
              <div className="text-emerald-200/90 text-xs leading-relaxed prose prose-emerald prose-invert max-w-none prose-xs">
                <ReactMarkdown>{suggestion}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Fallback: 舊格式或解析失敗時整段渲染 */
        <div className="prose prose-rose prose-invert max-w-none text-rose-200/80 text-xs leading-relaxed font-medium">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};
