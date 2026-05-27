"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatINRCompact } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  colorScheme?: "indigo" | "emerald" | "amber" | "violet" | "cyan" | "rose";
  format?: "currency" | "number" | "text";
  index?: number;
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    ring: "ring-indigo-100",
    gradient: "from-indigo-500 to-indigo-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    ring: "ring-emerald-100",
    gradient: "from-emerald-500 to-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    ring: "ring-amber-100",
    gradient: "from-amber-500 to-amber-600",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    ring: "ring-violet-100",
    gradient: "from-violet-500 to-violet-600",
  },
  cyan: {
    bg: "bg-cyan-50",
    icon: "text-cyan-600",
    ring: "ring-cyan-100",
    gradient: "from-cyan-500 to-cyan-600",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    ring: "ring-rose-100",
    gradient: "from-rose-500 to-rose-600",
  },
};

export function KPICard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  colorScheme = "indigo",
  format = "currency",
  index = 0,
}: KPICardProps) {
  const colors = colorMap[colorScheme];
  const isPositive = delta !== undefined ? delta >= 0 : true;

  const displayValue =
    format === "currency" && typeof value === "number"
      ? formatINRCompact(value)
      : typeof value === "number"
      ? value.toLocaleString("en-IN")
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center ring-4",
            colors.bg,
            colors.ring
          )}
        >
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
        {displayValue}
      </div>
      <div className="text-sm text-slate-500 font-medium">{title}</div>
      {deltaLabel && (
        <div className="text-xs text-slate-400 mt-1">{deltaLabel}</div>
      )}
    </motion.div>
  );
}
