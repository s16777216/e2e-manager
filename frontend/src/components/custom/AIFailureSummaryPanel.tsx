import React from "react";
import ReactMarkdown from "react-markdown";
import { Search, Lightbulb } from "lucide-react";

interface AIFailureSummaryPanelProps {
  summary?: {
    reason?: string;
    suggestion?: string;
  } | null;
}

export const AIFailureSummaryPanel: React.FC<AIFailureSummaryPanelProps> = ({
  summary,
}) => {
  if (!summary) return null;

  const { reason, suggestion } = summary;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4">
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

        {/* 修復建議 Bento 卡片 */}
        {suggestion && (
          <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4.5 flex flex-col gap-2.5">
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
    </div>
  );
};
