import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { iconSize: 28, textClass: "text-sm", subClass: "text-[10px]", fontSize: 11 },
  md: { iconSize: 36, textClass: "text-base", subClass: "text-[11px]", fontSize: 14 },
  lg: { iconSize: 48, textClass: "text-xl", subClass: "text-xs", fontSize: 18 },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const { iconSize, textClass, subClass, fontSize } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{
          width: iconSize,
          height: iconSize,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          boxShadow: "0 2px 8px rgba(79,70,229,0.35)",
        }}
      >
        <span
          style={{
            color: "white",
            fontWeight: 800,
            fontSize,
            letterSpacing: "-0.02em",
          }}
        >
          VK
        </span>
      </div>

      {showText && (
        <div>
          <div className={cn("font-bold text-slate-900 leading-tight tracking-tight", textClass)}>
            VyaparKhata
          </div>
          <div className={cn("text-slate-400 leading-tight", subClass)}>
            by Leafclutch Technologies
          </div>
        </div>
      )}
    </div>
  );
}
