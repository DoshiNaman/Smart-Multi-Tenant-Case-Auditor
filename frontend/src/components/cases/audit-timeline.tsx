import Link from "next/link";
import {
  FilePlusIcon,
  FileEditIcon,
  Trash2Icon,
  SparklesIcon,
  AlertCircleIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "lucide-react";
import { formatRelative } from "@/lib/case-helpers";
import type { AuditAction, AuditLog } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTION_META: Record<
  AuditAction,
  { label: string; icon: typeof FilePlusIcon; tone: string }
> = {
  CASE_CREATED: {
    label: "Case created",
    icon: FilePlusIcon,
    tone: "text-foreground bg-accent/10 border-accent/30",
  },
  CASE_UPDATED: {
    label: "Case edited",
    icon: FileEditIcon,
    tone: "text-muted-foreground bg-muted/50 border-border",
  },
  CASE_DELETED: {
    label: "Case deleted",
    icon: Trash2Icon,
    tone: "text-destructive bg-destructive/10 border-destructive/30",
  },
  AI_GENERATED: {
    label: "AI classified",
    icon: SparklesIcon,
    tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/30",
  },
  AI_FAILED: {
    label: "AI failed",
    icon: AlertCircleIcon,
    tone: "text-destructive bg-destructive/10 border-destructive/30",
  },
  AI_RETRIED: {
    label: "AI retried",
    icon: RotateCcwIcon,
    tone: "text-muted-foreground bg-muted/50 border-border",
  },
  AI_OVERRIDDEN: {
    label: "Partner override",
    icon: ShieldCheckIcon,
    tone: "text-accent bg-accent/10 border-accent/30",
  },
};

export function AuditTimeline({
  rows,
  showCase = false,
}: {
  rows: AuditLog[];
  /** When true, each entry links to its case. Use on tenant-wide feed. */
  showCase?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No audit entries yet.
      </div>
    );
  }
  return (
    <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
      {rows.map((r) => {
        const meta = ACTION_META[r.action];
        const Icon = meta.icon;
        return (
          <li key={r._id} className="relative pl-10">
            <span
              className={cn(
                "absolute left-0 top-0 size-8 rounded-full border grid place-items-center backdrop-blur",
                meta.tone,
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-sm">{meta.label}</span>
              <span className="text-xs text-muted-foreground">
                by{" "}
                {r.actorName ? (
                  <>
                    {r.actorName}
                    {r.actorRole && (
                      <span className="ml-1 text-[10px] tracking-wider opacity-70">
                        ({r.actorRole})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="italic">system</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                · {formatRelative(r.createdAt)}
              </span>
            </div>
            {showCase && (
              <Link
                href={`/cases/${r.caseId}`}
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors group"
              >
                <span className="opacity-60">on case</span>
                <span className="text-foreground/90 truncate max-w-[40ch]">
                  {r.caseTitle ?? "Untitled case"}
                </span>
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
            {r.note && (
              <p className="mt-1 text-xs text-muted-foreground font-mono">
                {r.note}
              </p>
            )}
            {r.changes.length > 0 && (
              <ul className="mt-2 space-y-1">
                {r.changes.map((ch, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-border/60 bg-card/40 px-3 py-2 text-xs"
                  >
                    <span className="font-mono text-foreground/90">
                      {ch.field}
                    </span>
                    <div className="mt-1 flex flex-col sm:flex-row gap-1 sm:gap-3 text-muted-foreground">
                      <ValueLine label="old" value={ch.oldValue} />
                      <ValueLine label="new" value={ch.newValue} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ValueLine({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <span className="block sm:inline">
      <span className="uppercase text-[10px] tracking-wider opacity-60 mr-1">
        {label}
      </span>
      <span className="text-foreground/80 break-words">
        {formatValue(value)}
      </span>
    </span>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 200 ? v.slice(0, 200) + "…" : v;
  return JSON.stringify(v);
}
