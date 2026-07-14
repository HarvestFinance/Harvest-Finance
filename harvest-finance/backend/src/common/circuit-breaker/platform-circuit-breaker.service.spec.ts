import { Test, TestingModule } from '@nestjs/testing';
import { PlatformCircuitBreakerService } from './platform-circuit-breaker.service';
import { CustomLoggerService } from '../../logger/custom-logger.service';

describe('PlatformCircuitBreakerService', () => {
  let service: PlatformCircuitBreakerService;
  let mockCacheManager: jest.Mocked<any>;
  let mockLogger: jest.Mocked<CustomLoggerService>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    mockLogger = {
      error: jest.fn(),
      errorEvent: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformCircuitBreakerService,
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PlatformCircuitBreakerService>(
      PlatformCircuitBreakerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isActive', () => {
    it('should return false when Redis has no value', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      expect(await service.isActive()).toBe(false);
    });

    it('should return false when Redis value is false', async () => {
      mockCacheManager.get.mockResolvedValue(false);
      expect(await service.isActive()).toBe(false);
    });

    it('should return true when Redis value is true', async () => {
      mockCacheManager.get.mockResolvedValue(true);
      expect(await service.isActive()).toBe(true);
    });

    it('should return false on cache error', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Redis down'));
      expect(await service.isActive()).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return active: false when not set', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      expect(await service.getState()).toEqual({ active: false });
    });

    it('should return active: true when set', async () => {
      mockCacheManager.get.mockResolvedValue(true);
      expect(await service.getState()).toEqual({ active: true });
    });
  });

  describe('activate', () => {
    it('should set active to true and log event', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      const result = await service.activate('admin-123', 'Critical incident');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'platform:circuit-breaker:active',
        true,
      );
      expect(mockLogger.errorEvent).toHaveBeenCalledWith(
        'platform_circuit_breaker_activated',
        expect.objectContaining({
          adminId: 'admin-123',
          reason: 'Critical incident',
        }),
      );
      expect(result).toEqual({ active: true });
    });

    it('should use default reason when none provided', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      await service.activate('admin-123');

      expect(mockLogger.errorEvent).toHaveBeenCalledWith(
        'platform_circuit_breaker_activated',
        expect.objectContaining({
          reason: 'Manual activation',
        }),
      );
    });

    it('should throw on Redis error', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis down'));
      await expect(service.activate('admin-123')).rejects.toThrow(
        'Failed to activate circuit breaker',
      );
    });

    it('should reject an empty admin identity', async () => {
      await expect(service.activate('   ')).rejects.toThrow(
        'Admin identity is required',
      );
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should set active to false and log event', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      const result = await service.deactivate('admin-123', 'Resolved');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'platform:circuit-breaker:active',
        false,
      );
      expect(mockLogger.errorEvent).toHaveBeenCalledWith(
        'platform_circuit_breaker_deactivated',
        expect.objectContaining({
          adminId: 'admin-123',
          reason: 'Resolved',
        }),
      );
      expect(result).toEqual({ active: false });
    });

    it('should use default reason when none provided', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      await service.deactivate('admin-123');

      expect(mockLogger.errorEvent).toHaveBeenCalledWith(
        'platform_circuit_breaker_deactivated',
        expect.objectContaining({
          reason: 'Manual deactivation',
        }),
      );
    });

    it('should throw on Redis error', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis down'));
      await expect(service.deactivate('admin-123')).rejects.toThrow(
        'Failed to deactivate circuit breaker',
      );
    });

    it('should reject a non-string reason', async () => {
      await expect(
        service.deactivate('admin-123', 123 as unknown as string),
      ).rejects.toThrow('Reason must be a string when provided');
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });
});
