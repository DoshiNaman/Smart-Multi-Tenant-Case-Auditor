import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { UserRole } from '../users/user-role.enum';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { OverrideClassificationDto } from './dto/override-classification.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCaseDto) {
    return this.cases.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListCasesQuery) {
    return this.cases.list(user, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cases.getById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.cases.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cases.delete(user, id);
  }

  @Post(':id/retry-ai')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  retryAi(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cases.retryClassification(user, id);
  }

  @Patch(':id/classification')
  @Roles(UserRole.Partner)
  override(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: OverrideClassificationDto,
  ) {
    return this.cases.overrideClassification(user, id, dto);
  }

  @Get(':id/audit')
  audit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cases.listAuditForCase(user, id);
  }
}
