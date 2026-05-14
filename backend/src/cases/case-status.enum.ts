export enum AiStatus {
  Pending = 'PENDING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
}

export enum RiskLevel {
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW',
}

export const AI_STATUSES = Object.values(AiStatus);
export const RISK_LEVELS = Object.values(RiskLevel);
