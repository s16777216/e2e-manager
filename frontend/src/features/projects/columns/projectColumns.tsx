import type { Project } from "@/types/api";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../../components/custom/table/ColumnHeader";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="專案名稱" />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="描述" />
    ),
  },
  {
    accessorKey: "testcaseCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="測試案例數"
        className="flex justify-center"
      />
    ),
    cell: ({ row }) => {
      const testcaseCount = row.getValue<number | undefined>("testcaseCount");
      return <div className="text-center">{testcaseCount ?? 0}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="建立時間"
        className="flex justify-center"
      />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue<string>("createdAt");
      return (
        <div className="text-center">
          {createdAt ? new Date(createdAt).toLocaleString() : "-"}
        </div>
      );
    },
  },
];
