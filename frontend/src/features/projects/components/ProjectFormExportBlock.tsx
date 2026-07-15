import { useState } from "react";
import { FormBlock } from "@/components/custom/form";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

export default function ProjectFormExportBlock({ projectId }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("正在打包專案數據並準備下載...");
    try {
      const exportUrl = api.exportProject(projectId);
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error("伺服器回應錯誤");
      }
      let filename = `project-${projectId}-export.json`;
      const disposition = response.headers.get("content-disposition");
      if (disposition && disposition.includes("filename*=UTF-8''")) {
        try {
          filename = decodeURIComponent(disposition.split("filename*=UTF-8''")[1]);
        } catch {
          // fallback to default filename
        }
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("專案 JSON 備份檔已成功匯出！", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("專案匯出失敗，請稍後再試", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <FormBlock
      label={
        <Typography type="h5" className="text-amber-400">
          專案備份與匯出
        </Typography>
      }
      description="將專案規格、測試群組與步驟匯出為 JSON 檔案，以供備份或跨環境轉移。"
      onSubmit={() => {}}
      showSubmitButton={false}
    >
      <Card className="border-amber-900/30 bg-amber-950/10">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Typography type="p" className="text-zinc-400">
                點擊下方按鈕以下載當前專案的完整 JSON 備份檔案
              </Typography>
            </div>
            <Button
              variant="outline"
              className="ml-4 border-amber-900/50 hover:bg-amber-950/30"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin text-amber-400" />
                  打包下載中...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  匯出 JSON
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </FormBlock>
  );
}

