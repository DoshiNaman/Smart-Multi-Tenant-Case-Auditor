import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";

export function PendingCard() {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-6">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-amber-500/10 border border-amber-500/30 grid place-items-center">
          <LoaderCircleIcon className="size-4 animate-spin text-amber-200" />
        </div>
        <div>
          <h3 className="text-sm font-medium">AI is analyzing this case</h3>
          <p className="text-xs text-muted-foreground">
            Usually completes in 2–5 seconds. This page refreshes automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

export function FailedCard({ error }: { error?: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-full bg-destructive/10 border border-destructive/30 grid place-items-center shrink-0">
          <AlertCircleIcon className="size-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Classification failed</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            The AI returned an error or malformed result. Click{" "}
            <span className="text-foreground">Retry classification</span> above
            to try again.
          </p>
          {error && (
            <p className="mt-2 text-xs font-mono text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
