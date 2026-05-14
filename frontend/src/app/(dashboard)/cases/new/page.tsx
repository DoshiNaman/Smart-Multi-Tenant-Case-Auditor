"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import type { Case } from "@/lib/types";

const MIN_TITLE = 3;
const MIN_SUMMARY = 20;
const MAX_SUMMARY = 10000;

export default function NewCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const titleOk = title.trim().length >= MIN_TITLE;
  const summaryOk =
    summary.trim().length >= MIN_SUMMARY &&
    summary.trim().length <= MAX_SUMMARY;
  const canSubmit = titleOk && summaryOk && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const created = await api<Case>("/cases", {
        method: "POST",
        body: { title: title.trim(), summary: summary.trim() },
      });
      toast.success("Case submitted — AI is classifying now.");
      router.replace(`/cases/${created._id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to submit case";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-10">
      <Link
        href="/cases"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-6 -ml-2 text-muted-foreground w-fit",
        })}
      >
        <ArrowLeftIcon className="size-4" />
        Back to cases
      </Link>

      <h1 className="heading-display text-3xl">Submit a case</h1>
      <p className="mt-1.5 text-muted-foreground text-sm max-w-xl">
        Paste a clear summary. The AI will analyze it for risk level,
        jurisdiction, and reasoning. You can always override the result.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs tracking-wide">
            Case title
          </Label>
          <Input
            id="title"
            placeholder="e.g. NDA breach — Vortex Ltd"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-11 bg-background/40"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {title.trim().length}/200 characters
            {!titleOk &&
              title.length > 0 &&
              ` — at least ${MIN_TITLE} required`}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary" className="text-xs tracking-wide">
            Case summary
          </Label>
          <Textarea
            id="summary"
            placeholder="Describe the parties, the jurisdiction, what's being claimed, and any standout facts. The richer the detail, the better the triage."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            rows={10}
            className="bg-background/40 font-mono text-[13px] resize-y"
            maxLength={MAX_SUMMARY}
          />
          <p className="text-xs text-muted-foreground">
            {summary.trim().length}/{MAX_SUMMARY} characters
            {!summaryOk &&
              summary.length > 0 &&
              ` — at least ${MIN_SUMMARY} required`}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SparklesIcon className="size-3.5 text-accent" />
            Classified by{" "}
            <code className="font-mono text-foreground/80">
              openai/gpt-4o-mini
            </code>
          </div>
          <Button type="submit" disabled={!canSubmit} className="min-w-32">
            {submitting ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit for triage"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
