"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AiStatusBadge } from "@/components/cases/ai-status-badge";
import { RiskBadge } from "@/components/cases/risk-badge";
import {
  PendingCard,
  FailedCard,
} from "@/components/cases/case-status-cards";
import { ClassificationCard } from "@/components/cases/classification-card";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import {
  effectiveRisk,
  formatRelative,
  isFieldOverridden,
} from "@/lib/case-helpers";
import type { AuditLog, Case } from "@/lib/types";

// Lazy chunks — defer download until actually rendered.
// OverrideDialog: only Partners on COMPLETED cases will ever hit this chunk.
// AuditTimeline: only loads once the user opens the Audit tab.
const OverrideDialog = dynamic(
  () =>
    import("@/components/cases/override-dialog").then((m) => ({
      default: m.OverrideDialog,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-7 w-44" />,
  },
);

const AuditTimeline = dynamic(
  () =>
    import("@/components/cases/audit-timeline").then((m) => ({
      default: m.AuditTimeline,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    ),
  },
);

const POLL_MS = 2000;
type TabValue = "overview" | "audit" | "summary";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const caseId = params.id;

  const [c, setCase] = useState<Case | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [tab, setTab] = useState<TabValue>("overview");
  const [auditOpenedOnce, setAuditOpenedOnce] = useState(false);

  const load = useCallback(async () => {
    try {
      const [next, log] = await Promise.all([
        api<Case>(`/cases/${caseId}`),
        api<AuditLog[]>(`/cases/${caseId}/audit`),
      ]);
      setCase(next);
      setAudit(log);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        toast.error("Case not found.");
        router.replace("/cases");
        return;
      }
      const msg =
        err instanceof ApiError ? err.message : "Failed to load case";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [caseId, router]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!c || c.aiStatus !== "PENDING") return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [c, load]);

  async function onRetry() {
    if (!c || retrying) return;
    setRetrying(true);
    try {
      await api(`/cases/${c._id}/retry-ai`, { method: "POST" });
      toast.success("Re-running classification…");
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Retry failed";
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  }

  if (loading || !c) {
    return (
      <div className="max-w-4xl w-full mx-auto px-6 py-10 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const risk = effectiveRisk(c);
  const isPartner = user?.role === "PARTNER";

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-10">
      <Link
        href="/cases"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-6 -ml-2 text-muted-foreground w-fit",
        })}
      >
        <ArrowLeftIcon className="size-4" />
        All cases
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <AiStatusBadge status={c.aiStatus} />
            {risk && (
              <RiskBadge
                level={risk}
                overridden={isFieldOverridden(c, "riskLevel")}
              />
            )}
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <ClockIcon className="size-3" />
              {formatRelative(c.createdAt)}
            </span>
          </div>
          <h1 className="heading-display text-2xl sm:text-3xl text-balance">
            {c.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {c.aiStatus === "FAILED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={retrying}
            >
              {retrying ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : (
                <RotateCcwIcon className="size-3.5" />
              )}
              Retry classification
            </Button>
          )}
          {c.aiStatus === "COMPLETED" && isPartner && (
            <OverrideDialog
              c={c}
              onUpdated={(next) => {
                setCase(next);
                void load();
              }}
            />
          )}
          {c.aiStatus === "COMPLETED" && !isPartner && (
            <span className="text-xs text-muted-foreground italic">
              Override available to Partners only
            </span>
          )}
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as TabValue;
          setTab(next);
          if (next === "audit") setAuditOpenedOnce(true);
        }}
        className="mt-8"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="audit">
            Audit
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              ({audit.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {c.aiStatus === "PENDING" && <PendingCard />}
          {c.aiStatus === "FAILED" && <FailedCard error={c.aiError} />}
          {c.aiStatus === "COMPLETED" && c.ai && <ClassificationCard c={c} />}
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <div className="rounded-xl border border-border bg-card/40 p-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Submitted summary
            </h3>
            <p className="whitespace-pre-wrap leading-relaxed text-pretty text-sm">
              {c.summary}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          {auditOpenedOnce && <AuditTimeline rows={audit} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
