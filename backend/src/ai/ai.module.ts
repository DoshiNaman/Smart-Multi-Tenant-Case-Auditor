import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { AiClassificationService } from './ai-classification.service';

@Module({
  imports: [AppConfigModule],
  providers: [AiClassificationService],
  exports: [AiClassificationService],
})
export class AiModule {}
