import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
