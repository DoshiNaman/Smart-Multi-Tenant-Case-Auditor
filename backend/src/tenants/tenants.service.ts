import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  findById(id: Types.ObjectId | string) {
    return this.tenantModel.findById(id).lean().exec();
  }

  async getById(id: Types.ObjectId | string) {
    const tenant = await this.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  findBySlug(slug: string) {
    return this.tenantModel.findOne({ slug: slug.toLowerCase() }).lean().exec();
  }

  async createIfMissing(name: string, slug: string) {
    const normalizedSlug = slug.toLowerCase();
    const existing = await this.tenantModel.findOne({ slug: normalizedSlug });
    if (existing) return existing.toObject();
    const created = await this.tenantModel.create({
      name,
      slug: normalizedSlug,
    });
    return created.toObject();
  }
}
