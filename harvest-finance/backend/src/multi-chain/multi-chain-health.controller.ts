import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ChainRegistryService } from './adapters/chain-registry.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health/multi-chain')
export class MultiChainHealthController {
  constructor(private readonly registry: ChainRegistryService) {}

  @Get()
  @ApiOperation({ summary: 'Check registered chain adapter health' })
  async check() {
    return {
      status: 'ok',
      adapters: await this.registry.refreshHealth(),
      checkedAt: new Date().toISOString(),
    };
  }
}
