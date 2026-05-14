import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/types/auth-user.type';
import { AuditAction } from './audit-action.enum';
import {
  AuditChange,
  AuditLog,
  AuditLogDocument,
} from './schemas/audit-log.schema';

export interface RecordInput {
  tenantId: Types.ObjectId;
  caseId: Types.ObjectId;
  action: AuditAction;
  actor: AuthUser | 'system';
  changes?: AuditChange[];
  note?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async record(input: RecordInput): Promise<void> {
    try {
      const actor = input.actor;
      await this.auditModel.create({
        tenantId: input.tenantId,
        caseId: input.caseId,
        action: input.action,
        actorId: actor === 'system' ? null : actor.userId,
        actorName: actor === 'system' ? null : actor.name,
        actorRole: actor === 'system' ? null : actor.role,
        changes: input.changes ?? [],
        note: input.note,
      });
    } catch (err) {
      // Audit writes must never break the primary operation.
      this.logger.error(
        'Failed to write audit log',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  listForCase(tenantId: Types.ObjectId, caseId: Types.ObjectId) {
    return this.auditModel
      .find({ tenantId, caseId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async listForTenant(tenantId: Types.ObjectId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.auditModel
        .aggregate([
          { $match: { tenantId } },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'cases',
              localField: 'caseId',
              foreignField: '_id',
              as: '_case',
              pipeline: [{ $project: { title: 1 } }],
            },
          },
          {
            $addFields: {
              caseTitle: { $arrayElemAt: ['$_case.title', 0] },
            },
          },
          { $project: { _case: 0 } },
        ])
        .exec(),
      this.auditModel.countDocuments({ tenantId }).exec(),
    ]);
    return { items, total, page, limit };
  }
}
