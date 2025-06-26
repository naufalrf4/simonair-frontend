import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  PaginationState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
  isLoading?: boolean;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  state?: {
    rowSelection?: RowSelectionState;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Cari...",
  searchValue,
  onSearchChange,
  pagination,
  isLoading = false,
  onRowSelectionChange,
  state = {},
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || "");
  
  // Sync external search value to local state
  useEffect(() => {
    if (searchValue !== undefined) {
      setLocalSearchValue(searchValue);
    }
  }, [searchValue]);

  // Apply filter from local state
  useEffect(() => {
    if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(localSearchValue);
    }
  }, [localSearchValue, searchColumn]);
  
  const defaultPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
  };
  
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination?.pageIndex ?? defaultPagination.pageIndex,
    pageSize: pagination?.pageSize ?? defaultPagination.pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: onRowSelectionChange,
    state: {
      sorting,
      columnFilters,
      ...(pagination 
        ? { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } } 
        : { pagination: paginationState }),
      rowSelection: state.rowSelection || {},
    },
    ...(pagination 
      ? { manualPagination: true, pageCount: pagination.pageCount } 
      : { getPaginationRowModel: getPaginationRowModel() }),
    onPaginationChange: pagination 
      ? (updater) => {
          if (typeof updater === 'function') {
            const newState = updater({
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
            });
            pagination.onPageChange(newState.pageIndex);
          } else {
            pagination.onPageChange(updater.pageIndex);
          }
        }
      : setPaginationState,
    enableRowSelection: true,
  });

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <div className="space-y-4">
      {searchColumn && (
        <div className="flex items-center relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={handleSearchInputChange}
            className="w-full max-w-sm pl-9"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={row.getIsSelected() ? "bg-primary/5" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length > 0 && (
            <>
              Menampilkan{" "}
              <span className="font-medium">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
              </span>{" "}
              -{" "}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  pagination
                    ? pagination.pageCount * pagination.pageSize
                    : table.getFilteredRowModel().rows.length
                )}
              </span>{" "}
              dari{" "}
              <span className="font-medium">
                {pagination
                  ? pagination.pageCount * pagination.pageSize
                  : table.getFilteredRowModel().rows.length}
              </span>{" "}
              data
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Halaman sebelumnya</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
            {pagination
              ? pagination.pageCount
              : table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Halaman berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 