"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronUp, ChevronDown, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index?: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  rowKey?: string | ((row: T) => string);
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable,
  searchKeys = [],
  searchPlaceholder = "Search…",
  emptyMessage = "No results found",
  rowKey,
  onRowClick,
  toolbar,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {(searchable || toolbar) && (
        <div className="flex items-center gap-3 flex-wrap p-4 pb-0">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 max-h-[65vh]">
        <table className="w-full min-w-[600px] lg:min-w-full text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  className={cn(
                    "px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap",
                    "bg-slate-50 border-b border-slate-200",
                    i === 0 && "rounded-tl-none",
                    col.sortable && "cursor-pointer hover:text-slate-700 select-none hover:bg-slate-100 transition-colors",
                    col.headerClassName
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className="flex flex-col gap-0">
                        <ChevronUp
                          className={cn(
                            "w-2.5 h-2.5 -mb-0.5",
                            sortKey === col.key && sortDir === "asc"
                              ? "text-brand-600"
                              : "text-slate-300"
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "w-2.5 h-2.5",
                            sortKey === col.key && sortDir === "desc"
                              ? "text-brand-600"
                              : "text-slate-300"
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="py-14 text-center">
                      <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Inbox className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                  <motion.tr
                    key={
                      typeof rowKey === "function"
                        ? rowKey(row)
                        : rowKey
                        ? String(row[rowKey])
                        : i
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.12, delay: i * 0.015 }}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "group border-b border-slate-50 last:border-0 transition-colors",
                      onRowClick
                        ? "cursor-pointer hover:bg-brand-50/40"
                        : "hover:bg-slate-50/70"
                    )}
                  >
                    {columns.map((col, ci) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          "px-4 py-3 text-sm text-slate-700",
                          ci === 0 && onRowClick && "group-hover:text-brand-700 font-medium",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row, i)
                          : String(row[col.key as keyof T] ?? "")}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && data.length !== sorted.length && (
        <p className="text-xs text-slate-400 text-right px-4 pb-3">
          {sorted.length} of {data.length} records
        </p>
      )}
    </div>
  );
}
