import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }
  get port(): number {
    return this.config.get('PORT', { infer: true });
  }
  get corsOrigin(): string {
    return this.config.get('CORS_ORIGIN', { infer: true });
  }
  get mongodbUri(): string {
    return this.config.get('MONGODB_URI', { infer: true });
  }
  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }
  get jwtExpiresIn(): string {
    return this.config.get('JWT_EXPIRES_IN', { infer: true });
  }
  get openRouterApiKey(): string {
    return this.config.get('OPENROUTER_API_KEY', { infer: true });
  }
  get openRouterModel(): string {
    return this.config.get('OPENROUTER_MODEL', { infer: true });
  }
  get openRouterBaseUrl(): string {
    return this.config.get('OPENROUTER_BASE_URL', { infer: true });
  }
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
