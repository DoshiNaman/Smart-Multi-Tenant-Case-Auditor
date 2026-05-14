export enum AuditAction {
  CaseCreated = 'CASE_CREATED',
  CaseUpdated = 'CASE_UPDATED',
  CaseDeleted = 'CASE_DELETED',
  AiGenerated = 'AI_GENERATED',
  AiFailed = 'AI_FAILED',
  AiRetried = 'AI_RETRIED',
  AiOverridden = 'AI_OVERRIDDEN',
}

export const AUDIT_ACTIONS = Object.values(AuditAction);
