import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import ms, { type StringValue } from 'ms';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AppConfigService } from '../config/app-config.service';
import type { AuthUser } from '../common/types/auth-user.type';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password);
    res.cookie(AUTH_COOKIE_NAME, result.token, this.cookieOptions());
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, this.cookieOptions());
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.userId, user.tenantId);
  }

  private cookieOptions(): CookieOptions {
    const maxAgeMs = this.resolveMaxAge(this.config.jwtExpiresIn);
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.isProduction,
      maxAge: maxAgeMs,
      path: '/',
    };
  }

  private resolveMaxAge(expiresIn: string): number {
    try {
      const result = ms(expiresIn as StringValue);
      return typeof result === 'number' ? result : 24 * 60 * 60 * 1000;
    } catch {
      return 24 * 60 * 60 * 1000;
    }
  }
}
