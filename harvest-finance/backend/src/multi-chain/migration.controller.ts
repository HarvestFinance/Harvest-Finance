import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MigratePositionDto } from './dto/migrate-position.dto';
import { MigrationService } from './migration.service';

@ApiTags('Multi-chain')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'multi-chain/migrations', version: '1' })
@UseGuards(JwtAuthGuard)
export class MigrationController {
  constructor(private readonly migrations: MigrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a signed cross-chain vault migration' })
  create(
    @Request() request: { user: { id: string } },
    @Body() body: MigratePositionDto,
  ) {
    return this.migrations.createMigration(request.user.id, body);
  }
}