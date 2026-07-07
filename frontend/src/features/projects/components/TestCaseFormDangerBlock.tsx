import { FormBlock } from "@/components/custom/form";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import TestCaseDeleteDialog from "./TestCaseDeleteDialog";
import { useState } from "react";

interface TestCaseFormDangerBlockProps {
  testcaseName: string;
  onTestCaseDelete: () => void | Promise<void>;
}

export default function TestCaseFormDangerBlock({
  testcaseName,
  onTestCaseDelete,
}: TestCaseFormDangerBlockProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTestCase = async () => {
    setIsDeleting(true);
    try {
      await onTestCaseDelete();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <FormBlock
        label={
          <Typography type="h5" className="text-red-400">
            危險區域
          </Typography>
        }
        description="此處的操作具備破壞性且不可逆，請謹慎執行。"
        onSubmit={() => {}}
        showSubmitButton={false}
      >
        <Card className="border-red-900/30 bg-red-950/10">
          <CardContent>
            <div className="flex justify-between gap-4 max-lg:flex-col lg:items-center">
              <div className="space-y-1">
                <Typography type="h6" className="text-red-400">
                  刪除測試案例
                </Typography>
                <Typography type="p" className="text-zinc-400">
                  刪除測試案例將永久刪除該案例及所有歷史執行紀錄。
                </Typography>
              </div>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 size={16} className="mr-2" />
                刪除測試案例
              </Button>
            </div>
          </CardContent>
        </Card>
      </FormBlock>
      <TestCaseDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        testcaseName={testcaseName}
        isDeleting={isDeleting}
        onConfirm={handleDeleteTestCase}
      />
    </>
  );
}
