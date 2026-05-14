import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

const STYLES: Record<RiskLevel, string> = {
  HIGH: "border-red-500/40 bg-red-500/10 text-red-200",
  MEDIUM: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  LOW: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
};

export function RiskBadge({
  level,
  overridden,
  className,
}: {
  level: RiskLevel;
  overridden?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wider uppercase",
        STYLES[level],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {level}
      {overridden && (
        <span className="ml-0.5 text-[10px] font-normal tracking-normal opacity-70 normal-case">
          (overridden)
        </span>
      )}
    </span>
  );
}
