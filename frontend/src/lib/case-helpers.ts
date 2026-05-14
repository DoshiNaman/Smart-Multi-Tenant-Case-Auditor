import type { Case, RiskLevel } from "./types";

/**
 * The "effective" value for a case classification field: the override if present,
 * else the AI's value.
 */
export function effectiveRisk(c: Case): RiskLevel | undefined {
  return c.override?.riskLevel ?? c.ai?.riskLevel;
}

export function effectiveJurisdiction(c: Case): string | undefined {
  return c.override?.jurisdiction ?? c.ai?.jurisdiction;
}

export function effectiveReasoning(c: Case): string | undefined {
  return c.override?.reasoning ?? c.ai?.reasoning;
}

export function isFieldOverridden(c: Case, field: "riskLevel" | "jurisdiction" | "reasoning"): boolean {
  return c.override?.[field] !== undefined;
}

export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
