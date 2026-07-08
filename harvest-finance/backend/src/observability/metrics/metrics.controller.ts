import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiExcludeEndpoint()
  @ApiBearerAuth()
  @Header('Content-Type', MetricsService.contentType)
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}

