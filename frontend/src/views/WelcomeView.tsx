import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomeView() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 select-none animate-fadeIn">
      {/* 歡迎卡片 (Bento Style) */}
      <div className="max-w-lg w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden group">
        {/* 背景微發光動畫 */}
        <div className="absolute -top-12 -left-12 h-32 w-32 bg-zinc-800 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />

        {/* Icon 徽章 */}
        <div className="h-16 w-16 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-300 shadow-md relative z-10">
          <Activity size={32} className="text-zinc-200 animate-pulse" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-zinc-400" />
            <h3 className="text-xl font-bold tracking-tight text-zinc-100">
              歡迎使用 Autape{" "}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed max-w-sm mx-auto">
            這是您的視覺化測試案例自動化主控台。您可以點擊下方按鈕前往「專案列表」來管理您的測試案例。
          </p>
        </div>

        <Button
          onClick={() => navigate("/project")}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all font-semibold flex items-center gap-2 px-6 py-5 shadow-lg w-full relative z-10"
        >
          <span>開始使用</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
