import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { Case, CaseSchema } from './schemas/case.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Case.name, schema: CaseSchema }]),
    AuthModule,
    AiModule,
    AuditModule,
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService, MongooseModule],
})
export class CasesModule {}
