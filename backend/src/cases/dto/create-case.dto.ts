import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  summary!: string;
}
