export type UserRole = "PARTNER" | "ASSOCIATE";

export type AiStatus = "PENDING" | "COMPLETED" | "FAILED";

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenant: Tenant;
}

export interface AiClassification {
  riskLevel: RiskLevel;
  jurisdiction: string;
  reasoning: string;
  model: string;
  generatedAt: string;
}

export interface CaseOverride {
  riskLevel?: RiskLevel;
  jurisdiction?: string;
  reasoning?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}

export interface Case {
  _id: string;
  tenantId: string;
  title: string;
  summary: string;
  submittedBy: string;
  aiStatus: AiStatus;
  aiError?: string;
  ai?: AiClassification;
  override?: CaseOverride;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type AuditAction =
  | "CASE_CREATED"
  | "CASE_UPDATED"
  | "CASE_DELETED"
  | "AI_GENERATED"
  | "AI_FAILED"
  | "AI_RETRIED"
  | "AI_OVERRIDDEN";

export interface AuditChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface AuditLog {
  _id: string;
  tenantId: string;
  caseId: string;
  /** Present on tenant-wide listings (joined from cases); absent on per-case listings. */
  caseTitle?: string;
  action: AuditAction;
  actorId: string | null;
  actorName: string | null;
  actorRole: UserRole | null;
  changes: AuditChange[];
  note?: string;
  createdAt: string;
}
