import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AUDIT_ACTIONS, AuditAction } from '../audit-action.enum';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ _id: false })
export class AuditChange {
  @Prop({ required: true }) field!: string;
  @Prop({ type: Object }) oldValue?: unknown;
  @Prop({ type: Object }) newValue?: unknown;
}
export const AuditChangeSchema = SchemaFactory.createForClass(AuditChange);

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Case', required: true, index: true })
  caseId!: Types.ObjectId;

  @Prop({ enum: AUDIT_ACTIONS, type: String, required: true })
  action!: AuditAction;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actorId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  actorName?: string | null;

  @Prop({ type: String, default: null })
  actorRole?: string | null;

  @Prop({ type: [AuditChangeSchema], default: [] })
  changes!: AuditChange[];

  @Prop()
  note?: string;

  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ tenantId: 1, caseId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
