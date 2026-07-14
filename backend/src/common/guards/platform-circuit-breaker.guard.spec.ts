import 'reflect-metadata';
import { PlatformCircuitBreakerGuard } from './platform-circuit-breaker.guard';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PlatformCircuitBreakerGuard', () => {
  let guard: PlatformCircuitBreakerGuard;
  let mockService: { isActive: jest.Mock };
  let mockReflector: { getAllAndOverride: jest.Mock };

  const createMockContext = (): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: jest.fn().mockReturnValue(() => {}),
      getClass: jest.fn().mockReturnValue(() => {}),
      getArgs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockService = {
      isActive: jest.fn(),
    };

    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new PlatformCircuitBreakerGuard(
      mockService as any,
      mockReflector as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow request when circuit breaker is inactive', async () => {
      mockService.isActive.mockResolvedValue(false);
      const context = createMockContext();

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockService.isActive).toHaveBeenCalled();
    });

    it('should throw HttpException with 503 status when active', async () => {
      mockService.isActive.mockResolvedValue(true);
      const context = createMockContext();

      try {
        await guard.canActivate(context);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(error.getResponse()).toEqual({
          statusCode: 503,
          message: expect.any(String),
          error: 'Maintenance Mode',
        });
      }
      expect(mockService.isActive).toHaveBeenCalled();
    });

    it('should allow request for exempt handlers even when active', async () => {
      mockService.isActive.mockResolvedValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockContext();

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockService.isActive).not.toHaveBeenCalled();
    });

    it('should throw 500 on service error when checking state', async () => {
      mockService.isActive.mockRejectedValue(new Error('Redis down'));
      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Unable to verify service availability. Please try again.',
      );
    });
  });
});
