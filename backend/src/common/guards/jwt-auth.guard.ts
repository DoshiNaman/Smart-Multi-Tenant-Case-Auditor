import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { AUTH_COOKIE_NAME } from '../../auth/auth.constants';
import { AuthUser, JwtPayload } from '../types/auth-user.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Authentication required');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user: AuthUser = {
      userId: new Types.ObjectId(payload.sub),
      tenantId: new Types.ObjectId(payload.tenantId),
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    req.user = user;
    return true;
  }

  private extractToken(req: Request): string | null {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
      AUTH_COOKIE_NAME
    ];
    if (cookieToken) return cookieToken;

    const header = req.headers.authorization;
    if (header?.toLowerCase().startsWith('bearer ')) {
      return header.slice(7).trim();
    }
    return null;
  }
}
