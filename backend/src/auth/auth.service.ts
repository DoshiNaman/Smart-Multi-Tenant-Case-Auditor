import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/types/auth-user.type';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenant: { id: string; name: string; slug: string };
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await this.usersService.verifyPassword(
      password,
      user.passwordHash,
    );
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tenant = await this.tenantsService.getById(user.tenantId);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: (tenant._id as Types.ObjectId).toString(),
          name: tenant.name,
          slug: tenant.slug,
        },
      },
    };
  }

  async getProfile(userId: Types.ObjectId, tenantId: Types.ObjectId) {
    const user = await this.usersService.findByIdInTenant(userId, tenantId);
    if (!user) throw new UnauthorizedException('User no longer exists');
    const tenant = await this.tenantsService.getById(tenantId);
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenant: {
        id: (tenant._id as Types.ObjectId).toString(),
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }
}
