import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AI_STATUSES, AiStatus, RISK_LEVELS, RiskLevel } from '../case-status.enum';

@Schema({ _id: false })
export class AiClassification {
  @Prop({ enum: RISK_LEVELS, type: String, required: true })
  riskLevel!: RiskLevel;

  @Prop({ required: true, trim: true })
  jurisdiction!: string;

  @Prop({ required: true })
  reasoning!: string;

  @Prop({ required: true })
  model!: string;

  @Prop({ required: true })
  generatedAt!: Date;
}

export const AiClassificationSchema = SchemaFactory.createForClass(AiClassification);

@Schema({ _id: false })
export class CaseOverride {
  @Prop({ enum: RISK_LEVELS, type: String })
  riskLevel?: RiskLevel;

  @Prop({ trim: true })
  jurisdiction?: string;

  @Prop()
  reasoning?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  overriddenBy?: Types.ObjectId;

  @Prop()
  overriddenAt?: Date;
}

export const CaseOverrideSchema = SchemaFactory.createForClass(CaseOverride);

export type CaseDocument = HydratedDocument<Case>;

@Schema({ timestamps: true, collection: 'cases' })
export class Case {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy!: Types.ObjectId;

  @Prop({
    enum: AI_STATUSES,
    type: String,
    required: true,
    default: AiStatus.Pending,
  })
  aiStatus!: AiStatus;

  @Prop()
  aiError?: string;

  @Prop({ type: AiClassificationSchema })
  ai?: AiClassification;

  @Prop({ type: CaseOverrideSchema })
  override?: CaseOverride;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CaseSchema = SchemaFactory.createForClass(Case);
CaseSchema.index({ tenantId: 1, createdAt: -1 });
CaseSchema.index({ tenantId: 1, aiStatus: 1 });
