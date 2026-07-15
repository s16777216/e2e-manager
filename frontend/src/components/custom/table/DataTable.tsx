"use no memo";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
  getExpandedRowModel,
  type ExpandedState,
  type Row,
  type TableOptions,
  type RowSelectionState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./Pagination";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchIcon } from "@/components/icon/searchc";
import { Checkbox } from "@/components/ui/checkbox";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowDbClick?: (row: TData) => void;
  onRowClick?: (row: TData) => void;
  topbarContent?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  getSubRows?: (row: TData) => TData[] | undefined;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  getRowId: TableOptions<TData>["getRowId"];
  expanded?: ExpandedState;
  onExpandedChange?: React.Dispatch<React.SetStateAction<ExpandedState>>;
  enableRowSelection: TableOptions<TData>["enableRowSelection"];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowDbClick,
  onRowClick,
  topbarContent,
  showSearch = true,
  searchPlaceholder = "搜尋...",
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange: controlledOnGlobalFilterChange,
  getSubRows,
  getRowCanExpand,
  getRowId,
  expanded: controlledExpanded,
  onExpandedChange: controlledOnExpandedChange,
  enableRowSelection = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // 支援受控與非受控狀態下的 globalFilter
  const [internalGlobalFilter, setInternalGlobalFilter] = useState<string>("");
  const isControlled = controlledGlobalFilter !== undefined;
  const globalFilter = isControlled
    ? controlledGlobalFilter
    : internalGlobalFilter;
  const setGlobalFilter = isControlled
    ? controlledOnGlobalFilterChange
    : setInternalGlobalFilter;

  // 支援受控與非受控狀態下的 expanded
  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({});
  const isExpandedControlled = controlledExpanded !== undefined;
  const expanded = isExpandedControlled ? controlledExpanded : internalExpanded;
  const setExpanded = isExpandedControlled
    ? controlledOnExpandedChange
    : setInternalExpanded;

  // selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const renderColumns = () => {
    const cols = [...columns];
    if (enableRowSelection) {
      cols.unshift({
        id: "selection",
        size: 10,
        minSize: 10,
        maxSize: 10,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.getToggleAllRowsSelectedHandler()({
                target: value,
              })
            }
          />
        ),
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <Checkbox
              checked={
                row.getIsAllSubRowsSelected() ||
                (row.getIsSomeSelected() && "indeterminate")
              }
              disabled={!row.getCanSelect()}
              onCheckedChange={row.getToggleSelectedHandler()}
            />
          ) : (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onCheckedChange={row.getToggleSelectedHandler()}
            />
          ),
      });
    }
    return cols;
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: renderColumns(),
    getSubRows,
    getRowCanExpand,
    getRowId,
    paginateExpandedRows: false,
    filterFromLeafRows: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
      rowSelection,
    },
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {(showSearch || topbarContent) && (
        <div className="flex items-center py-4 justify-between w-full">
          {showSearch ? (
            <div className="relative w-120">
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <Input
                type="text"
                value={globalFilter}
                onChange={(e) => table.setGlobalFilter(String(e.target.value))}
                placeholder={searchPlaceholder}
                className="pl-9 focus-visible:ring-1 w-full text-sm h-9"
              />
            </div>
          ) : (
            <div />
          )}
          {topbarContent}
        </div>
      )}
      <ScrollArea className="w-full rounded-md border mb-2 [&_[data-slot=table-container]]:overflow-visible">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="px-6 py-4"
                      style={{
                        width: header.getSize(),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onDoubleClick={() => onRowDbClick?.(row.original)}
                  onClick={() => onRowClick?.(row.original)}
                  className={
                    onRowClick || onRowDbClick
                      ? "cursor-pointer hover:bg-zinc-900/20 transition-colors"
                      : ""
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-6 py-4"
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-zinc-500"
                >
                  找不到符合條件的紀錄。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* 分頁 */}
      <DataTablePagination table={table} />
    </div>
  );
}
