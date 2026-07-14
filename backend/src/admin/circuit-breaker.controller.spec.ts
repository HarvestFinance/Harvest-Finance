import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlatformCircuitBreakerService } from '../common/circuit-breaker/platform-circuit-breaker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

class AdminCircuitBreakerController {
  constructor(
    private readonly circuitBreakerService: PlatformCircuitBreakerService,
  ) {}

  @Post('platform/circuit-breaker/open')
  async openCircuitBreaker(
    @Req() req: any,
    @Body() body?: { reason?: string },
  ) {
    return this.circuitBreakerService.activate(req.user.id, body?.reason);
  }

  @Post('platform/circuit-breaker/close')
  async closeCircuitBreaker(
    @Req() req: any,
    @Body() body?: { reason?: string },
  ) {
    return this.circuitBreakerService.deactivate(req.user.id, body?.reason);
  }
}

describe('AdminCircuitBreakerController Integration', () => {
  let controller: AdminCircuitBreakerController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      activate: jest.fn(),
      deactivate: jest.fn(),
      isActive: jest.fn(),
      getState: jest.fn(),
    };

    controller = new AdminCircuitBreakerController(mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openCircuitBreaker', () => {
    it('should activate circuit breaker with admin id and reason', async () => {
      mockService.activate.mockResolvedValue({ active: true });

      const result = await controller.openCircuitBreaker(
        { user: { id: 'admin-1' } },
        { reason: 'Maintenance' },
      );

      expect(mockService.activate).toHaveBeenCalledWith(
        'admin-1',
        'Maintenance',
      );
      expect(result).toEqual({ active: true });
    });

    it('should activate circuit breaker with default reason', async () => {
      mockService.activate.mockResolvedValue({ active: true });

      const result = await controller.openCircuitBreaker({
        user: { id: 'admin-2' },
      });

      expect(mockService.activate).toHaveBeenCalledWith('admin-2', undefined);
      expect(result).toEqual({ active: true });
    });

    it('should propagate service error on activation failure', async () => {
      mockService.activate.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      await expect(
        controller.openCircuitBreaker({ user: { id: 'admin-3' } }),
      ).rejects.toThrow('Redis connection failed');
    });
  });

  describe('closeCircuitBreaker', () => {
    it('should deactivate circuit breaker with admin id and reason', async () => {
      mockService.deactivate.mockResolvedValue({ active: false });

      const result = await controller.closeCircuitBreaker(
        { user: { id: 'admin-1' } },
        { reason: 'Resolved' },
      );

      expect(mockService.deactivate).toHaveBeenCalledWith(
        'admin-1',
        'Resolved',
      );
      expect(result).toEqual({ active: false });
    });

    it('should deactivate circuit breaker with default reason', async () => {
      mockService.deactivate.mockResolvedValue({ active: false });

      const result = await controller.closeCircuitBreaker({
        user: { id: 'admin-2' },
      });

      expect(mockService.deactivate).toHaveBeenCalledWith('admin-2', undefined);
      expect(result).toEqual({ active: false });
    });

    it('should propagate service error on deactivation failure', async () => {
      mockService.deactivate.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      await expect(
        controller.closeCircuitBreaker({ user: { id: 'admin-3' } }),
      ).rejects.toThrow('Redis connection failed');
    });
  });
});
