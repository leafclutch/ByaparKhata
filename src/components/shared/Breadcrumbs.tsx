import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2", className)}>
      <Link href="/admin" className="hover:text-brand-600 transition-colors">
        <Home className="w-3 h-3" />
      </Link>
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <ChevronRight className="w-2.5 h-2.5 opacity-50" />
          {item.href ? (
            <Link href={item.href} className="hover:text-brand-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-500">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
