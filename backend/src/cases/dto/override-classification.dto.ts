import { PartialType } from '@nestjs/mapped-types';
import { ClassificationFieldsDto } from './classification-fields.dto';

export class OverrideClassificationDto extends PartialType(
  ClassificationFieldsDto,
) {}
