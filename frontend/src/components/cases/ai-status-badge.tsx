import { LoaderCircleIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiStatus } from "@/lib/types";

const STYLES: Record<AiStatus, string> = {
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-200",
  COMPLETED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  FAILED:
    "border-destructive/40 bg-destructive/10 text-destructive",
};

const LABELS: Record<AiStatus, string> = {
  PENDING: "Classifying",
  COMPLETED: "Classified",
  FAILED: "Failed",
};

export function AiStatusBadge({
  status,
  className,
}: {
  status: AiStatus;
  className?: string;
}) {
  const Icon =
    status === "PENDING"
      ? LoaderCircleIcon
      : status === "COMPLETED"
        ? CheckCircle2Icon
        : AlertCircleIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        STYLES[status],
        className,
      )}
    >
      <Icon
        className={cn("size-3", status === "PENDING" && "animate-spin")}
      />
      {LABELS[status]}
    </span>
  );
}
