import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SorobanHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const rpcUrl = this.configService.get<string>('SOROBAN_RPC_URL');
    if (!rpcUrl) {
      return this.getStatus(key, true, { message: 'SOROBAN_RPC_URL not configured' });
    }

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        return this.getStatus(key, true);
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      const result = this.getStatus(key, false, { message: error.message });
      throw new HealthCheckError('Soroban RPC healthcheck failed', result);
    }
  }
}
