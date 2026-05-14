import { MapPinIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RiskBadge } from "@/components/cases/risk-badge";
import {
  effectiveJurisdiction,
  effectiveReasoning,
  isFieldOverridden,
} from "@/lib/case-helpers";
import type { Case, RiskLevel } from "@/lib/types";

interface Props {
  c: Case;
}

export function ClassificationCard({ c }: Props) {
  if (!c.ai) return null;

  const jurisdiction = effectiveJurisdiction(c);
  const reasoning = effectiveReasoning(c);
  const hasOverride = hasAnyOverride(c);
  const reasoningOverridden = isFieldOverridden(c, "reasoning");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card/40 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-accent" />
            <h3 className="text-sm font-medium">Classification</h3>
          </div>
          {hasOverride && (
            <div className="inline-flex items-center gap-1.5 text-xs text-accent">
              <ShieldCheckIcon className="size-3.5" />
              Partner override applied
            </div>
          )}
        </div>

        <dl className="grid sm:grid-cols-3 gap-4">
          <RiskField
            ai={c.ai.riskLevel}
            current={c.override?.riskLevel ?? c.ai.riskLevel}
            overridden={isFieldOverridden(c, "riskLevel")}
          />
          <TextField
            label="Jurisdiction"
            icon={<MapPinIcon className="size-3" />}
            ai={c.ai.jurisdiction}
            current={jurisdiction}
            overridden={isFieldOverridden(c, "jurisdiction")}
          />
          <TextField label="Model" ai={c.ai.model} current={c.ai.model} mono />
        </dl>

        <Separator className="my-5" />

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
              Reasoning
            </h4>
            {reasoningOverridden && (
              <span className="text-[10px] text-accent uppercase tracking-wider">
                overridden
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-pretty">{reasoning}</p>
          {reasoningOverridden && c.ai.reasoning && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View original AI reasoning
              </summary>
              <p className="mt-2 text-muted-foreground italic border-l-2 border-border pl-3">
                {c.ai.reasoning}
              </p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskField({
  ai,
  current,
  overridden,
}: {
  ai: RiskLevel;
  current: RiskLevel;
  overridden: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        Risk level
      </dt>
      <dd>
        <RiskBadge level={current} overridden={overridden} />
      </dd>
      {overridden && current !== ai && (
        <p className="mt-1 text-[11px] text-muted-foreground line-through truncate">
          {ai}
        </p>
      )}
    </div>
  );
}

function TextField({
  label,
  icon,
  ai,
  current,
  overridden,
  mono,
}: {
  label: string;
  icon?: React.ReactNode;
  ai: string;
  current?: string;
  overridden?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
        {icon}
        {label}
      </dt>
      <dd>
        <span
          className={`text-sm ${mono ? "font-mono text-foreground/80" : ""}`}
        >
          {current}
        </span>
      </dd>
      {overridden && current !== ai && (
        <p className="mt-1 text-[11px] text-muted-foreground line-through truncate">
          {ai}
        </p>
      )}
    </div>
  );
}

function hasAnyOverride(c: Case): boolean {
  if (!c.override) return false;
  return (
    isFieldOverridden(c, "riskLevel") ||
    isFieldOverridden(c, "jurisdiction") ||
    isFieldOverridden(c, "reasoning")
  );
}
