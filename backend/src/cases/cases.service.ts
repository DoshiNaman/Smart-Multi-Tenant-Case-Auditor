import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiClassificationService } from '../ai/ai-classification.service';
import { AuditAction } from '../audit/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user.type';
import { QueueService } from '../queue/queue.service';
import { AiStatus } from './case-status.enum';
import { CreateCaseDto } from './dto/create-case.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { OverrideClassificationDto } from './dto/override-classification.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { Case, CaseDocument } from './schemas/case.schema';

type CaseFilter = {
  tenantId: Types.ObjectId;
  aiStatus?: AiStatus;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const OVERRIDABLE_FIELDS = ['riskLevel', 'jurisdiction', 'reasoning'] as const;
type OverrideField = (typeof OVERRIDABLE_FIELDS)[number];

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    @InjectModel(Case.name) private readonly caseModel: Model<CaseDocument>,
    private readonly classifier: AiClassificationService,
    private readonly queue: QueueService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateCaseDto) {
    const created = await this.caseModel.create({
      tenantId: user.tenantId,
      submittedBy: user.userId,
      title: dto.title.trim(),
      summary: dto.summary.trim(),
      aiStatus: AiStatus.Pending,
    });
    const caseObj = created.toObject();
    await this.audit.record({
      tenantId: user.tenantId,
      caseId: caseObj._id,
      action: AuditAction.CaseCreated,
      actor: user,
      changes: [
        { field: 'title', oldValue: null, newValue: caseObj.title },
        { field: 'summary', oldValue: null, newValue: caseObj.summary },
      ],
    });
    this.scheduleClassification(caseObj._id, user.tenantId, caseObj.summary);
    return caseObj;
  }

  async list(user: AuthUser, query: ListCasesQuery) {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const filter: CaseFilter = { tenantId: user.tenantId };
    if (query.status) filter.aiStatus = query.status;

    const [items, total] = await Promise.all([
      this.caseModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.caseModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async getById(user: AuthUser, id: string) {
    return this.findOwnedOrThrow(user, id);
  }

  async update(user: AuthUser, id: string, dto: UpdateCaseDto) {
    if (dto.title === undefined && dto.summary === undefined) {
      throw new BadRequestException('No fields to update');
    }
    const existing = await this.findOwnedOrThrow(user, id);

    const patch: Partial<Case> = {};
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

    if (dto.title !== undefined && dto.title.trim() !== existing.title) {
      patch.title = dto.title.trim();
      changes.push({
        field: 'title',
        oldValue: existing.title,
        newValue: patch.title,
      });
    }
    if (dto.summary !== undefined && dto.summary.trim() !== existing.summary) {
      patch.summary = dto.summary.trim();
      changes.push({
        field: 'summary',
        oldValue: existing.summary,
        newValue: patch.summary,
      });
    }

    if (changes.length === 0) return existing;

    const updated = await this.caseModel
      .findOneAndUpdate(
        { _id: existing._id, tenantId: user.tenantId },
        { $set: patch },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Case not found');

    await this.audit.record({
      tenantId: user.tenantId,
      caseId: existing._id,
      action: AuditAction.CaseUpdated,
      actor: user,
      changes,
    });
    return updated;
  }

  async delete(user: AuthUser, id: string) {
    const existing = await this.findOwnedOrThrow(user, id);
    await this.caseModel
      .deleteOne({ _id: existing._id, tenantId: user.tenantId })
      .exec();
    await this.audit.record({
      tenantId: user.tenantId,
      caseId: existing._id,
      action: AuditAction.CaseDeleted,
      actor: user,
    });
    return { ok: true };
  }

  async retryClassification(user: AuthUser, id: string) {
    const existing = await this.findOwnedOrThrow(user, id);
    if (existing.aiStatus === AiStatus.Pending) {
      throw new ConflictException('Classification already in progress');
    }
    const updated = await this.caseModel
      .findOneAndUpdate(
        { _id: existing._id, tenantId: user.tenantId },
        { $set: { aiStatus: AiStatus.Pending }, $unset: { aiError: '' } },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Case not found');

    await this.audit.record({
      tenantId: user.tenantId,
      caseId: existing._id,
      action: AuditAction.AiRetried,
      actor: user,
    });
    this.scheduleClassification(updated._id, user.tenantId, updated.summary);
    return updated;
  }

  async overrideClassification(
    user: AuthUser,
    id: string,
    dto: OverrideClassificationDto,
  ) {
    const provided = OVERRIDABLE_FIELDS.filter(
      (f) => dto[f] !== undefined,
    ) as OverrideField[];
    if (provided.length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }
    const existing = await this.findOwnedOrThrow(user, id);
    if (!existing.ai) {
      throw new ConflictException(
        'Cannot override a case that has not been classified yet',
      );
    }

    const prevOverride = existing.override ?? {};
    const set: Record<string, unknown> = {
      'override.overriddenBy': user.userId,
      'override.overriddenAt': new Date(),
    };
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

    for (const field of provided) {
      const newValue =
        field === 'jurisdiction' || field === 'reasoning'
          ? (dto[field] as string).trim()
          : dto[field];
      const oldValue =
        (prevOverride as Record<string, unknown>)[field] ?? existing.ai[field];
      if (oldValue === newValue) continue;
      set[`override.${field}`] = newValue;
      changes.push({ field, oldValue, newValue });
    }

    if (changes.length === 0) return existing;

    const updated = await this.caseModel
      .findOneAndUpdate(
        { _id: existing._id, tenantId: user.tenantId },
        { $set: set },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Case not found');

    await this.audit.record({
      tenantId: user.tenantId,
      caseId: existing._id,
      action: AuditAction.AiOverridden,
      actor: user,
      changes,
    });
    return updated;
  }

  private scheduleClassification(
    caseId: Types.ObjectId,
    tenantId: Types.ObjectId,
    summary: string,
  ) {
    this.queue.enqueue(`classify:${caseId.toString()}`, async () => {
      const result = await this.classifier.classify(summary);
      if (result.ok) {
        await this.caseModel.updateOne(
          { _id: caseId },
          {
            $set: {
              aiStatus: AiStatus.Completed,
              ai: {
                riskLevel: result.data.riskLevel,
                jurisdiction: result.data.jurisdiction,
                reasoning: result.data.reasoning,
                model: result.model,
                generatedAt: new Date(),
              },
            },
            $unset: { aiError: '' },
          },
        );
        await this.audit.record({
          tenantId,
          caseId,
          action: AuditAction.AiGenerated,
          actor: 'system',
          changes: [
            {
              field: 'riskLevel',
              oldValue: null,
              newValue: result.data.riskLevel,
            },
            {
              field: 'jurisdiction',
              oldValue: null,
              newValue: result.data.jurisdiction,
            },
            {
              field: 'reasoning',
              oldValue: null,
              newValue: result.data.reasoning,
            },
          ],
          note: `model=${result.model}`,
        });
        this.logger.log(`Case ${caseId.toString()} classified`);
      } else {
        await this.caseModel.updateOne(
          { _id: caseId },
          { $set: { aiStatus: AiStatus.Failed, aiError: result.error } },
        );
        await this.audit.record({
          tenantId,
          caseId,
          action: AuditAction.AiFailed,
          actor: 'system',
          note: result.error,
        });
        this.logger.warn(
          `Case ${caseId.toString()} classification failed: ${result.error}`,
        );
      }
    });
  }

  async listAuditForCase(user: AuthUser, id: string) {
    const existing = await this.findOwnedOrThrow(user, id);
    return this.audit.listForCase(user.tenantId, existing._id);
  }

  private async findOwnedOrThrow(user: AuthUser, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Case not found');
    }
    const doc = await this.caseModel
      .findOne({ _id: id, tenantId: user.tenantId })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Case not found');
    return doc;
  }
}
