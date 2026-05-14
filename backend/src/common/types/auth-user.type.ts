import { Types } from 'mongoose';
import { UserRole } from '../../users/user-role.enum';

export interface AuthUser {
  userId: Types.ObjectId;
  tenantId: Types.ObjectId;
  role: UserRole;
  email: string;
  name: string;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
