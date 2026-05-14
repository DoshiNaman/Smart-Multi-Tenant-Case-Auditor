"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { PlusIcon, FileTextIcon, ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AiStatusBadge } from "@/components/cases/ai-status-badge";
import { RiskBadge } from "@/components/cases/risk-badge";
import { api, ApiError } from "@/lib/api";
import {
  effectiveJurisdiction,
  effectiveRisk,
  formatRelative,
  isFieldOverridden,
} from "@/lib/case-helpers";
import type { AiStatus, Case, Paginated } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const FILTERS: Array<{ value: "ALL" | AiStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Classifying" },
  { value: "COMPLETED", label: "Classified" },
  { value: "FAILED", label: "Failed" },
];

export default function CasesListPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>(
    "ALL",
  );
  const [data, setData] = useState<Paginated<Case> | null>(null);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchCases = useCallback(async () => {
    try {
      const qs = filter === "ALL" ? "" : `?status=${filter}`;
      const res = await api<Paginated<Case>>(`/cases${qs}`);
      setData(res);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load cases";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    void fetchCases();
  }, [fetchCases]);

  // Light polling: if any case is PENDING, refresh every 2.5s
  useEffect(() => {
    if (!data) return;
    const hasPending = data.items.some((c) => c.aiStatus === "PENDING");
    if (!hasPending) return;
    const t = setInterval(() => {
      void fetchCases();
    }, 2500);
    return () => clearInterval(t);
  }, [data, fetchCases]);

  useGSAP(
    () => {
      gsap.from(".case-row", {
        y: 14,
        opacity: 0,
        duration: 0.45,
        ease: "power3.out",
        stagger: 0.05,
      });
    },
    { scope: gridRef, dependencies: [data?.items.length, filter] },
  );

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-display text-3xl sm:text-4xl">Cases</h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Submit a summary, watch the AI triage, and override when judgement
            calls.
          </p>
        </div>
        <Link
          href="/cases/new"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          <PlusIcon className="size-4" />
          New case
        </Link>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as (typeof FILTERS)[number]["value"])}
        className="mb-6"
      >
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div ref={gridRef} className="space-y-3">
          {data.items.map((c) => (
            <CaseRow key={c._id} c={c} />
          ))}
          <div className="pt-2 text-xs text-muted-foreground">
            {data.total} case{data.total === 1 ? "" : "s"}
          </div>
        </div>
      ) : (
        <EmptyState filter={filter} />
      )}
    </div>
  );
}

function CaseRow({ c }: { c: Case }) {
  const risk = effectiveRisk(c);
  const jurisdiction = effectiveJurisdiction(c);
  const riskOverridden = isFieldOverridden(c, "riskLevel");

  return (
    <Link
      href={`/cases/${c._id}`}
      className="case-row group block rounded-xl border border-border bg-card/40 p-5 hover:border-accent/40 hover:bg-card/70 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h2 className="text-base font-medium leading-tight truncate max-w-[42ch]">
              {c.title}
            </h2>
            <AiStatusBadge status={c.aiStatus} />
            {risk && <RiskBadge level={risk} overridden={riskOverridden} />}
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 max-w-prose">
            {c.summary}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {jurisdiction && (
              <span className="inline-flex items-center gap-1.5">
                <FileTextIcon className="size-3" />
                {jurisdiction}
              </span>
            )}
            <span>{formatRelative(c.createdAt)}</span>
          </div>
        </div>
        <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 self-start sm:self-center shrink-0" />
      </div>
    </Link>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 text-center">
      <div className="mx-auto size-12 rounded-xl bg-accent/10 grid place-items-center mb-4">
        <FileTextIcon className="size-5 text-accent" />
      </div>
      <h3 className="heading-display text-lg">
        {filter === "ALL" ? "No cases yet" : `No ${filter.toLowerCase()} cases`}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Submit a case summary and the AI will classify risk, jurisdiction, and
        reasoning within seconds.
      </p>
      <Link href="/cases/new" className={buttonVariants({ className: "mt-5" })}>
        <PlusIcon className="size-4" />
        Submit a case
      </Link>
    </div>
  );
}

