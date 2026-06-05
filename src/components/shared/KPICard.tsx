"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatNPRCompact } from "@/lib/utils";

const colorMap = {
  indigo: {
    gradient: "from-indigo-500 to-indigo-700",
    ring: "ring-indigo-100",
    accent: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-700",
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-700",
    ring: "ring-emerald-100",
    accent: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700",
  },
  amber: {
    gradient: "from-amber-400 to-amber-600",
    ring: "ring-amber-100",
    accent: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700",
  },
  violet: {
    gradient: "from-violet-500 to-violet-700",
    ring: "ring-violet-100",
    accent: "bg-violet-500",
    soft: "bg-violet-50 text-violet-700",
  },
  cyan: {
    gradient: "from-cyan-500 to-cyan-700",
    ring: "ring-cyan-100",
    accent: "bg-cyan-500",
    soft: "bg-cyan-50 text-cyan-700",
  },
  rose: {
    gradient: "from-rose-500 to-rose-700",
    ring: "ring-rose-100",
    accent: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700",
  },
  blue: {
    gradient: "from-blue-500 to-blue-700",
    ring: "ring-blue-100",
    accent: "bg-blue-500",
    soft: "bg-blue-50 text-blue-700",
  },
};

export function KPICard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  colorScheme = "indigo",
  format = "number",
  index = 0,
}: {
  title: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  colorScheme?: keyof typeof colorMap;
  format?: "currency" | "number" | "text";
  index?: number;
}) {
  const colors = colorMap[colorScheme];
  const isPositive = delta !== undefined ? delta >= 0 : true;

  const displayValue =
    format === "currency" && typeof value === "number"
      ? formatNPRCompact(value)
      : typeof value === "number"
      ? value.toLocaleString()
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Subtle top gradient accent */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60", colors.gradient)} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 leading-snug pr-2">{title}</p>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0 shadow-sm",
            colors.gradient
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums mb-2">
        {displayValue}
      </p>

      {delta !== undefined ? (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
              isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      ) : deltaLabel ? (
        <p className="text-xs text-slate-400">{deltaLabel}</p>
      ) : null}
    </motion.div>
  );
}
