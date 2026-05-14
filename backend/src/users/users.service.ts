import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from './user-role.enum';

const BCRYPT_ROUNDS = 10;

export interface CreateUserInput {
  tenantId: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();
  }

  findByIdInTenant(id: Types.ObjectId | string, tenantId: Types.ObjectId) {
    return this.userModel.findOne({ _id: id, tenantId }).lean().exec();
  }

  async createIfMissing(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({
      tenantId: input.tenantId,
      email,
    });
    if (existing) return existing.toObject();
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const created = await this.userModel.create({
      tenantId: input.tenantId,
      email,
      passwordHash,
      name: input.name,
      role: input.role,
    });
    return created.toObject();
  }

  verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
