import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Task } from "../types/api";
import { Clock, Loader2 } from "lucide-react";

import { toast } from "sonner";
import { DataTable } from "../components/custom/table/DataTable";
import { columns } from "../table-columns/History";

export default function HistoryView() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 篩選狀態

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData] = await Promise.all([api.getAllTasks()]);
        setTasks(tasksData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error("載入歷史紀錄失敗：" + msg);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
          <span className="text-xs italic">載入執行歷史紀錄中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-foreground select-none p-8 animate-fadeIn">
      {/* 頂部 Header */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent flex items-center gap-2">
            <Clock size={24} className="text-zinc-400" />
            執行紀錄
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
            監控所有專案的批次測試執行歷史，並追蹤其即時狀態與測試覆蓋進度。
          </p>
        </div>
      </div>

      {/* 歷史任務表格 */}
      <div className="w-full mx-auto flex-1 flex flex-col">
        <DataTable
          columns={columns}
          data={tasks}
          onRowDbClick={(row) => {
            if (!row.projectId) {
              toast.error("此任務缺少專案資訊，無法跳轉");
              return;
            }
            if (row.scope === "testcase") {
              const runId = row.runs?.[0]?.runId;
              if (runId) {
                navigate(`/project/${row.projectId}/run/${runId}`);
              } else {
                toast.warning("未找到執行記錄，導航至任務詳情");
                navigate(`/project/${row.projectId}/tasks/${row.id}`);
              }
              return;
            }
            // scope === "project" 或 "group"：維持既有批次監控頁面行為
            navigate(`/project/${row.projectId}/tasks/${row.id}`);
          }}
          showSearch={false}
        />
      </div>
    </div>
  );
}
