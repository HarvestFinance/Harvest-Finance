import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformCircuitBreakerService } from '../circuit-breaker/platform-circuit-breaker.service';

export const CIRCUIT_BREAKER_EXEMPT = 'circuitBreakerExempt';
export const CircuitBreakerExempt = () =>
  SetMetadata(CIRCUIT_BREAKER_EXEMPT, true);

@Injectable()
export class PlatformCircuitBreakerGuard implements CanActivate {
  constructor(
    private circuitBreakerService: PlatformCircuitBreakerService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isExempt = this.reflector.getAllAndOverride<boolean>(
      CIRCUIT_BREAKER_EXEMPT,
      [context.getHandler(), context.getClass()],
    );
    if (isExempt) {
      return true;
    }

    try {
      const isActive = await this.circuitBreakerService.isActive();
      if (!isActive) {
        return true;
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Unable to verify service availability. Please try again.',
      );
    }

    const maintenanceMessage =
      'Platform deposits and withdrawals are temporarily unavailable due to a security incident or maintenance window. Please try again later.';

    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: maintenanceMessage,
        error: 'Maintenance Mode',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
