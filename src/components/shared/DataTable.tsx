"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
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
        <div className="flex items-center gap-3 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-white"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap",
                      col.sortable && "cursor-pointer hover:text-slate-700 select-none",
                      col.headerClassName
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="flex flex-col -space-y-1">
                          <ChevronUp className={cn("w-3 h-3", sortKey === col.key && sortDir === "asc" ? "text-brand-600" : "text-slate-300")} />
                          <ChevronDown className={cn("w-3 h-3", sortKey === col.key && sortDir === "desc" ? "text-brand-600" : "text-slate-300")} />
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
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  sorted.map((row, i) => (
                    <motion.tr
                      key={typeof rowKey === "function" ? rowKey(row) : rowKey ? String(row[rowKey]) : i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "border-b border-slate-50 last:border-0 transition-colors",
                        onRowClick && "cursor-pointer hover:bg-slate-50"
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={cn("px-4 py-3 text-sm text-slate-700", col.className)}
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
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {sorted.length} of {data.length} records
        </p>
      )}
    </div>
  );
}
