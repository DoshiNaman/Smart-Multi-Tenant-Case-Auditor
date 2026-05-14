"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTextIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditTimeline } from "@/components/cases/audit-timeline";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import type { AuditLog, Paginated } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const PAGE_SIZE = 25;

export default function TenantAuditPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      try {
        const res = await api<Paginated<AuditLog>>(
          `/audit?page=${p}&limit=${PAGE_SIZE}`,
        );
        setTotal(res.total);
        setPage(res.page);
        setRows((prev) => (append ? [...prev, ...res.items] : res.items));
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Failed to load audit feed";
        toast.error(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    void fetchPage(1, false);
  }, [fetchPage]);

  useGSAP(
    () => {
      gsap.from(".audit-enter", {
        y: 14,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.04,
      });
    },
    { scope: containerRef, dependencies: [rows.length === 0, !loading] },
  );

  const hasMore = rows.length < total;

  return (
    <div ref={containerRef} className="max-w-4xl w-full mx-auto px-6 py-10">
      <div className="audit-enter flex items-center gap-3 mb-2">
        <div className="size-9 rounded-xl bg-accent/10 border border-accent/30 grid place-items-center">
          <ScrollTextIcon className="size-4 text-accent" />
        </div>
        <div>
          <h1 className="heading-display text-3xl">Audit log</h1>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            {user?.tenant.name ?? ""} · firm-wide activity
          </p>
        </div>
      </div>

      <p className="audit-enter mt-3 mb-8 text-sm text-muted-foreground max-w-prose">
        An immutable, append-only record of every case event in your firm —
        creations, AI classifications, partner overrides, retries. Nothing is
        ever edited or deleted.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="audit-enter">
            <AuditTimeline rows={rows} showCase />
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} of {total} entries
            </p>
            {hasMore && (
              <Button
                variant="outline"
                onClick={() => {
                  setLoadingMore(true);
                  void fetchPage(page + 1, true);
                }}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load older entries"
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
