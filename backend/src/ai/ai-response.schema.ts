import { z } from 'zod';
import { RISK_LEVELS, RiskLevel } from '../cases/case-status.enum';

export const aiResponseSchema = z.object({
  riskLevel: z.enum(RISK_LEVELS as [RiskLevel, ...RiskLevel[]]),
  jurisdiction: z.string().min(1).max(200),
  reasoning: z.string().min(10).max(4000),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
