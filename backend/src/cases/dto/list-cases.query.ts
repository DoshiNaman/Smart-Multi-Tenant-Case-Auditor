import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AiStatus } from '../case-status.enum';

export class ListCasesQuery {
  @IsOptional()
  @IsEnum(AiStatus)
  status?: AiStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
