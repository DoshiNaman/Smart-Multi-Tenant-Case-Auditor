import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { RiskLevel } from '../case-status.enum';

export class ClassificationFieldsDto {
  @IsEnum(RiskLevel)
  riskLevel!: RiskLevel;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  jurisdiction!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  reasoning!: string;
}
