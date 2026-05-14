"use client";

import { useState } from "react";
import { LoaderCircleIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import type { Case, RiskLevel } from "@/lib/types";

const RISKS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

export function OverrideDialog({
  c,
  onUpdated,
}: {
  c: Case;
  onUpdated: (next: Case) => void;
}) {
  const [open, setOpen] = useState(false);
  const [risk, setRisk] = useState<RiskLevel | undefined>(
    c.override?.riskLevel ?? c.ai?.riskLevel,
  );
  const [jurisdiction, setJurisdiction] = useState(
    c.override?.jurisdiction ?? c.ai?.jurisdiction ?? "",
  );
  const [reasoning, setReasoning] = useState(
    c.override?.reasoning ?? c.ai?.reasoning ?? "",
  );
  const [submitting, setSubmitting] = useState(false);

  if (!c.ai) return null;

  const aiRisk = c.ai.riskLevel;
  const aiJurisdiction = c.ai.jurisdiction;
  const aiReasoning = c.ai.reasoning;

  function buildPatch() {
    const patch: Partial<{
      riskLevel: RiskLevel;
      jurisdiction: string;
      reasoning: string;
    }> = {};
    if (risk && risk !== aiRisk) patch.riskLevel = risk;
    if (jurisdiction.trim() && jurisdiction.trim() !== aiJurisdiction)
      patch.jurisdiction = jurisdiction.trim();
    if (reasoning.trim() && reasoning.trim() !== aiReasoning)
      patch.reasoning = reasoning.trim();
    return patch;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      toast.error("Nothing to override — values match the AI output.");
      return;
    }
    setSubmitting(true);
    try {
      const next = await api<Case>(`/cases/${c._id}/classification`, {
        method: "PATCH",
        body: patch,
      });
      toast.success("Override recorded in the audit trail.");
      onUpdated(next);
      setOpen(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Override failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <PencilIcon className="size-3.5" />
        Override classification
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Override AI classification</DialogTitle>
          <DialogDescription>
            Changes are logged with your name in the audit trail. The original
            AI values stay traceable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs tracking-wide">Risk level</Label>
            <Tabs value={risk} onValueChange={(v) => setRisk(v as RiskLevel)}>
              <TabsList className="w-full">
                {RISKS.map((r) => (
                  <TabsTrigger key={r} value={r} className="flex-1">
                    {r}
                    {r === aiRisk && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        (AI)
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jurisdiction" className="text-xs tracking-wide">
              Jurisdiction
            </Label>
            <Input
              id="jurisdiction"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              placeholder={aiJurisdiction}
              className="bg-background/40"
            />
            {jurisdiction.trim() !== aiJurisdiction && (
              <p className="text-xs text-muted-foreground">
                AI said:{" "}
                <span className="text-foreground/80">{aiJurisdiction}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasoning" className="text-xs tracking-wide">
              Reasoning
            </Label>
            <Textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={5}
              className="bg-background/40 font-mono text-[13px]"
              maxLength={4000}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save override"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
