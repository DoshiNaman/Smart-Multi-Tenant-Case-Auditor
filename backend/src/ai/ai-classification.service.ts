import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AppConfigService } from '../config/app-config.service';
import { aiResponseSchema, AiResponse } from './ai-response.schema';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `You are a legal case classifier for a multi-tenant audit platform.
Given a legal case summary, return ONLY a JSON object with these exact fields:

{
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "jurisdiction": "<region, state, country, or court system>",
  "reasoning": "<1-3 sentence explanation tying riskLevel and jurisdiction to specific facts in the summary>"
}

Guidance:
- HIGH: criminal liability, large damages (>$1M), regulatory action, class-action, reputational threat, time-sensitive injunction.
- MEDIUM: contract disputes, IP infringement, employment claims, mid-size civil suits.
- LOW: routine compliance, minor disputes, document review, standard agreements.
- jurisdiction: extract the most specific applicable region (e.g. "California state court", "EU GDPR", "U.S. federal — Ninth Circuit"). If not stated, infer the most likely jurisdiction from facts and say "(inferred)".
- Do NOT include any text outside the JSON object. No markdown fences.`;

export interface ClassificationResult {
  ok: true;
  data: AiResponse;
  model: string;
}
export interface ClassificationFailure {
  ok: false;
  error: string;
}

@Injectable()
export class AiClassificationService {
  private readonly logger = new Logger(AiClassificationService.name);
  private readonly client: OpenAI;

  constructor(private readonly config: AppConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.openRouterApiKey,
      baseURL: this.config.openRouterBaseUrl,
      timeout: REQUEST_TIMEOUT_MS,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Smart Case Auditor',
      },
    });
  }

  async classify(
    summary: string,
  ): Promise<ClassificationResult | ClassificationFailure> {
    const model = this.config.openRouterModel;
    let lastError = 'Unknown error';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(attempt > 1
              ? [
                  {
                    role: 'system' as const,
                    content:
                      'Your previous response was invalid JSON or did not match the required schema. Return ONLY the JSON object — no commentary, no markdown.',
                  },
                ]
              : []),
            { role: 'user', content: summary },
          ],
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (!raw) {
          lastError = 'Empty response from model';
          continue;
        }

        const parsed = this.safeParseJson(raw);
        if (!parsed.ok) {
          lastError = `Malformed JSON: ${parsed.error}`;
          continue;
        }

        const validated = aiResponseSchema.safeParse(parsed.value);
        if (!validated.success) {
          lastError = `Schema violation: ${validated.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`;
          continue;
        }

        return { ok: true, data: validated.data, model };
      } catch (err) {
        lastError =
          err instanceof Error ? err.message : 'Unknown classifier error';
        this.logger.warn(
          `Classification attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastError}`,
        );
      }
    }

    return { ok: false, error: lastError };
  }

  private safeParseJson(
    raw: string,
  ): { ok: true; value: unknown } | { ok: false; error: string } {
    const cleaned = raw
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    try {
      return { ok: true, value: JSON.parse(cleaned) as unknown };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'parse error',
      };
    }
  }
}
