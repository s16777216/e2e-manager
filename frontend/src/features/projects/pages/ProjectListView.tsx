import { useNavigate } from "react-router-dom";
import { useProjectData } from "../hooks/useProjectData";
import { Button } from "@/components/ui/button";
import { columns } from "../columns/projectColumns";
import { DataTable } from "../../../components/custom/table/DataTable";
import { PlusIcon } from "@/components/icon/plus";
import { FolderPlusIcon } from "@/components/icon/folder-plus";

export default function ProjectListView() {
  const navigate = useNavigate();
  const { projects } = useProjectData();

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 p-4 select-none">
      {/* 頂部 Header & 新增按鈕 */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            專案管理
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
            選擇一個測試專案進入工作區，或在右側建立一個全新專案來開始進行群組與步驟管理。
          </p>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={() => navigate("/project/new")}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all font-semibold flex items-center gap-2 px-5 py-5 shadow-lg shadow-zinc-100/10"
            >
                <PlusIcon size={16} /> 建立新專案
            </Button>
            <Button
                onClick={() => navigate("/projects/import")}
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-all font-semibold flex items-center gap-2 px-5 py-5"
            >
                <FolderPlusIcon size={16} /> 匯入專案
            </Button>
        </div>
      </div>

      {/* 搜尋列與表格內容區 */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-6">
        {/* 專案表格 */}
        <DataTable
          columns={columns}
          data={projects}
          onRowDbClick={(row) => navigate(`/project/${row.id}`)}
          topbarContent={
            <div className="flex justify-end w-full">
            </div>
          }
        />
      </div>
    </div>
  );
}
