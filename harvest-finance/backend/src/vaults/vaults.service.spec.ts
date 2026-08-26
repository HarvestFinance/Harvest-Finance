import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { VaultsService } from './vaults.service';
import { FeesService } from './fees.service';
import { WithdrawalQueueService } from './withdrawal-queue.service';
import { Vault, VaultStatus, VaultType } from '../database/entities/vault.entity';
import { Deposit, DepositStatus } from '../database/entities/deposit.entity';
import { VaultApyHistory } from '../database/entities/vault-apy-history.entity';
import { VaultReservation } from './entities/vault-reservation.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Withdrawal,
  WithdrawalStatus,
} from '../database/entities/withdrawal.entity';
import { Strategy, CompoundingFrequency } from '../database/entities/strategy.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { VaultGateway } from '../realtime/vault.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContractCacheService } from '../common/cache/contract-cache.service';
import { InputSanitizerService } from '../common/sanitization/input-sanitizer.service';
import { DepositEventService } from './deposit-event.service';
import { ExternalPaymentEventType } from './dto/external-payment-notification.dto';
import { VaultReservation } from './entities/vault-reservation.entity';
import { AuthService } from '../auth/auth.service';

describe('VaultsService', () => {
  let service: VaultsService;

  const mockVault = {
    id: 'vault-1',
    ownerId: 'user-1',
    vaultName: 'Test Vault',
    type: VaultType.CROP_PRODUCTION,
    status: VaultStatus.ACTIVE,
    totalDeposits: 1000,
    maxCapacity: 10000,
    isFullCapacity: false,
    availableCapacity: 9000,
    utilizationPercentage: 10,
    approvalStatus: 'PENDING',
    description: 'Test vault description',
    symbol: 'TEST',
    assetPair: 'XLM/USDC',
    interestRate: 5,
    maturityDate: new Date('2030-01-01'),
    lockPeriodEnd: new Date('2027-01-01'),
    isPublic: true,
    requiresMultiSignature: false,
    approvalThreshold: 1,
    currentApprovals: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deposits: [],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockVaultApprovalRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  // mockDataSource is defined below after all repository mocks are initialised.

  const mockVaultRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDepositRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockWithdrawalRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockReservationQB = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
  };

  const mockVaultReservationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockReservationQB),
  };

  const mockEntityManager = {
    save: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    getRepository: jest.fn((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === VaultApproval) return mockVaultApprovalRepository;
      if (entity === Vault) return mockVaultRepository;
      if (entity === Deposit) return mockDepositRepository;
      if (entity === Withdrawal) return mockWithdrawalRepository;
      if (entity === VaultReservation) return mockVaultReservationRepository;
      return null;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb: (em: typeof mockEntityManager) => unknown) =>
      cb(mockEntityManager),
    ),
    getRepository: jest.fn((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === VaultApproval) return mockVaultApprovalRepository;
      if (entity === Vault) return mockVaultRepository;
      if (entity === Deposit) return mockDepositRepository;
      if (entity === Withdrawal) return mockWithdrawalRepository;
      if (entity === VaultReservation) return mockVaultReservationRepository;
      return null;
    }),
    createQueryBuilder: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    }),
  };

  const mockApyHistoryQB = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const mockVaultApyHistoryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockApyHistoryQB),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const mockVaultGateway = {
    emitDeposit: jest.fn(),
    emitWithdrawal: jest.fn(),
  };
  const mockEventEmitter = { emit: jest.fn() };
  const mockContractCache = {
    getVaultState: jest.fn((_id: string, loader: () => Promise<Vault>) => loader()),
  };
  const mockSanitizer = {
    validateUUID: jest.fn((id: string) => id),
  };
  const mockDepositEventService = {
    appendEvent: jest.fn().mockResolvedValue(undefined),
    getDepositHistory: jest.fn().mockResolvedValue([]),
    getUserDepositHistory: jest.fn().mockResolvedValue([]),
    getVaultDepositHistory: jest.fn().mockResolvedValue([]),
    mapEventToResponse: jest.fn((event) => event),
  };
const mockStrategyRepository = {
  findOne: jest.fn(),
};

const mockApyHistoryRepository = {
  createQueryBuilder: jest.fn(),
};

const buildQB = (total: string | null) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ total }),
});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultsService,
        { provide: getRepositoryToken(Vault), useValue: mockVaultRepository },
        {
          provide: getRepositoryToken(Deposit),
          useValue: mockDepositRepository,
        },
        {
          provide: getRepositoryToken(Withdrawal),
          useValue: mockWithdrawalRepository,
        },
        {
          provide: getRepositoryToken(VaultReservation),
          useValue: mockVaultReservationRepository,
        },
        {
          provide: getRepositoryToken(VaultApyHistory),
          useValue: mockVaultApyHistoryRepository,
        },
        { provide: getRepositoryToken(VaultReservation), useValue: { find: jest.fn(), save: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        { provide: getRepositoryToken(Strategy), useValue: mockStrategyRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: CustomLoggerService, useValue: mockLogger },
        { provide: VaultGateway, useValue: mockVaultGateway },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ContractCacheService, useValue: mockContractCache },
        { provide: InputSanitizerService, useValue: mockSanitizer },
        { provide: DepositEventService, useValue: mockDepositEventService },
        FeesService,
        {
          provide: WithdrawalQueueService,
          useValue: { processWithdrawalQueue: jest.fn().mockResolvedValue(undefined), enqueueWithdrawal: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: AuthService, useValue: { isEmailVerified: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<VaultsService>(VaultsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getVaultById
  // ---------------------------------------------------------------------------
  describe('getVaultById', () => {
    it('should return vault when found', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);

      const result = await service.getVaultById('vault-1');

      expect(result).toEqual(mockVault);
      expect(mockContractCache.getVaultState).toHaveBeenCalledWith(
        'vault-1',
        expect.any(Function),
      );
    });

    it('should throw NotFoundException when vault does not exist', async () => {
      mockVaultRepository.findOne.mockResolvedValue(null);

      await expect(service.getVaultById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getVaultById('nonexistent')).rejects.toThrow(
        'Vault not found',
      );
    });

    it('should sanitize the vault ID before lookup', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);
      mockSanitizer.validateUUID.mockReturnValueOnce('vault-1');

      await service.getVaultById('vault-1');

      expect(mockSanitizer.validateUUID).toHaveBeenCalledWith('vault-1');
    });
  });

  // ---------------------------------------------------------------------------
  // withdrawFromVault
  // ---------------------------------------------------------------------------
  describe('withdrawFromVault', () => {
    it('should successfully withdraw funds', async () => {
      const updatedVault = { ...mockVault, totalDeposits: 900 };
      const pendingWithdrawal = {
        id: 'w-1',
        userId: 'user-1',
        vaultId: 'vault-1',
        amount: 100,
        status: WithdrawalStatus.PENDING,
      };

      mockVaultRepository.findOne.mockResolvedValue(mockVault);
      mockDepositRepository.createQueryBuilder.mockReturnValue(buildQB('1000'));
      mockWithdrawalRepository.create.mockReturnValue(pendingWithdrawal);
      mockEntityManager.save.mockResolvedValue(pendingWithdrawal);
      mockEntityManager.decrement.mockResolvedValue(undefined);
      mockEntityManager.findOne.mockResolvedValue(updatedVault);
      mockWithdrawalRepository.update.mockResolvedValue(undefined);
      mockWithdrawalRepository.findOne.mockResolvedValue(pendingWithdrawal);

      const result = await service.withdrawFromVault('vault-1', 'user-1', 100);

      expect(result.withdrawal).toBeDefined();
      expect(mockEntityManager.decrement).toHaveBeenCalledWith(
        Vault,
        { id: 'vault-1' },
        'totalDeposits',
        100,
      );
    });

    it('should throw NotFoundException if vault not found', async () => {
      mockVaultRepository.findOne.mockResolvedValue(null);

      await expect(
        service.withdrawFromVault('nonexistent', 'user-1', 100),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if amount is zero', async () => {
      await expect(
        service.withdrawFromVault('vault-1', 'user-1', 0),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.withdrawFromVault('vault-1', 'user-1', 0),
      ).rejects.toThrow('Withdrawal amount must be greater than 0');
    });

    it('should throw BadRequestException if amount is negative', async () => {
      await expect(
        service.withdrawFromVault('vault-1', 'user-1', -50),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vault is FROZEN', async () => {
      mockVaultRepository.findOne.mockResolvedValue({
        ...mockVault,
        status: VaultStatus.FROZEN,
      });

      await expect(
        service.withdrawFromVault('vault-1', 'user-1', 100),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.withdrawFromVault('vault-1', 'user-1', 100),
      ).rejects.toThrow('Vault is frozen. Withdrawals are blocked.');
    });

    it('should throw BadRequestException if insufficient user balance', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);
      mockDepositRepository.createQueryBuilder.mockReturnValue(buildQB('50'));

      await expect(
        service.withdrawFromVault('vault-1', 'user-1', 100),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.withdrawFromVault('vault-1', 'user-1', 100),
      ).rejects.toThrow('Insufficient balance for withdrawal');
    });

    it('should transition FULL_CAPACITY vault back to ACTIVE after withdrawal', async () => {
      const fullVault = { ...mockVault, status: VaultStatus.FULL_CAPACITY };
      const updatedVault = { ...fullVault, totalDeposits: 900 };

      mockVaultRepository.findOne.mockResolvedValue(fullVault);
      mockDepositRepository.createQueryBuilder.mockReturnValue(buildQB('1000'));
      const pendingWithdrawal = {
        id: 'w-1',
        userId: 'user-1',
        vaultId: 'vault-1',
        amount: 100,
        status: WithdrawalStatus.PENDING,
      };
      mockWithdrawalRepository.create.mockReturnValue(pendingWithdrawal);
      mockEntityManager.save.mockResolvedValue(pendingWithdrawal);
      mockEntityManager.decrement.mockResolvedValue(undefined);
      mockEntityManager.findOne.mockResolvedValue({
        ...updatedVault,
        status: VaultStatus.FULL_CAPACITY,
      });
      mockWithdrawalRepository.findOne.mockResolvedValue(pendingWithdrawal);

      await service.withdrawFromVault('vault-1', 'user-1', 100);

      expect(mockEntityManager.update).toHaveBeenCalledWith(
        Vault,
        { id: 'vault-1' },
        { status: VaultStatus.ACTIVE },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // depositToVault
  // ---------------------------------------------------------------------------
  describe('depositToVault', () => {
    it('should throw BadRequestException if vault is not active', async () => {
      mockVaultRepository.findOne.mockResolvedValue({
        ...mockVault,
        status: VaultStatus.INACTIVE,
      });

      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 100 }),
      ).rejects.toThrow('Vault is not active for deposits');
    });

    it('should throw NotFoundException if vault not found', async () => {
      mockVaultRepository.findOne.mockResolvedValue(null);

      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for zero deposit', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);

      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 0 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 0 }),
      ).rejects.toThrow('Deposit amount must be greater than 0');
    });

    it('should throw BadRequestException for negative deposit', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);

      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: -100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for deposit exceeding available capacity', async () => {
      const smallCapacityVault = { ...mockVault, availableCapacity: 100 };
      mockVaultRepository.findOne.mockResolvedValue(smallCapacityVault);

      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 1000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when vault is at full capacity', async () => {
      const fullVault = {
        ...mockVault,
        isFullCapacity: true,
        status: VaultStatus.FULL_CAPACITY,
        availableCapacity: 0,
      };
      mockVaultRepository.findOne.mockResolvedValue(fullVault);

      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.depositToVault('vault-1', { userId: 'user-1', amount: 100 }),
      ).rejects.toThrow('Vault is not active for deposits');
    });

    it('should reject deposit exceeding MAX_SAFE_DEPOSIT limit (1e30)', async () => {
      const beyondSafeLimit = 1e31;
      mockVaultRepository.findOne.mockResolvedValue({
        ...mockVault,
        availableCapacity: beyondSafeLimit,
      });

      await expect(
        service.depositToVault('vault-1', {
          userId: 'user-1',
          amount: beyondSafeLimit,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.depositToVault('vault-1', {
          userId: 'user-1',
          amount: beyondSafeLimit,
        }),
      ).rejects.toThrow('Deposit amount exceeds maximum allowed value');
    });

    it('should return existing deposit for duplicate idempotencyKey', async () => {
      const existingDeposit = {
        id: 'dep-existing',
        userId: 'user-1',
        vaultId: 'vault-1',
        amount: 500,
        status: DepositStatus.CONFIRMED,
        vault: mockVault,
        transactionHash: '0xabc',
        confirmedAt: new Date(),
        createdAt: new Date(),
      };
      mockDepositRepository.findOne.mockResolvedValue(existingDeposit);
      mockDepositRepository.createQueryBuilder.mockReturnValue(buildQB('500'));

      const result = await service.depositToVault('vault-1', {
        userId: 'user-1',
        amount: 500,
        idempotencyKey: 'idem-key-1',
      });

      expect(result.deposit.id).toBe('dep-existing');
      // Should not reach the vault lookup
      expect(mockVaultRepository.findOne).not.toHaveBeenCalled();
    });
  });



  // ---------------------------------------------------------------------------
  // getUserTotalDeposits
  // ---------------------------------------------------------------------------
  describe('getUserTotalDeposits', () => {
    it('should sum all confirmed deposits for a user', async () => {
      const mockQB = buildQB('1234.56');
      mockDepositRepository.createQueryBuilder.mockReturnValue(mockQB);

      const total = await service.getUserTotalDeposits('user-1');

      expect(total).toBe(1234.56);
      expect(mockQB.andWhere).toHaveBeenCalledWith('deposit.status = :status', {
        status: DepositStatus.CONFIRMED,
      });
    });

    it('should return 0 when repository returns null total', async () => {
      const mockQB = buildQB(null);
      mockDepositRepository.createQueryBuilder.mockReturnValue(mockQB);

      const total = await service.getUserTotalDeposits('user-2');

      expect(total).toBe(0);
    });

    it('should return 0 when repository returns undefined total', async () => {
      const mockQB = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      mockDepositRepository.createQueryBuilder.mockReturnValue(mockQB);

      const total = await service.getUserTotalDeposits('user-3');

      expect(total).toBe(0);
    });
  });

  describe('calculateApy', () => {
    it('should calculate APY with daily compounding', () => {
      const apy = service.calculateApy(5, CompoundingFrequency.DAILY);
      // APY = (1 + 0.05/365)^365 - 1 ≈ 5.127%
      expect(apy).toBeCloseTo(5.13, 1);
    });

    it('should calculate APY with weekly compounding', () => {
      const apy = service.calculateApy(5, CompoundingFrequency.WEEKLY);
      // APY = (1 + 0.05/52)^52 - 1 ≈ 5.116%
      expect(apy).toBeCloseTo(5.12, 1);
    });

    it('should calculate APY with monthly compounding', () => {
      const apy = service.calculateApy(5, CompoundingFrequency.MONTHLY);
      // APY = (1 + 0.05/12)^12 - 1 ≈ 5.116%
      expect(apy).toBeCloseTo(5.12, 1);
    });

    it('should return 0 for zero APR', () => {
      const apy = service.calculateApy(0, CompoundingFrequency.DAILY);
      expect(apy).toBe(0);
    });

    it('should default to daily compounding when no frequency provided', () => {
      const apy = service.calculateApy(5);
      const apyDaily = service.calculateApy(5, CompoundingFrequency.DAILY);
      expect(apy).toBe(apyDaily);
    });

    it('should handle high APR values', () => {
      const apy = service.calculateApy(100, CompoundingFrequency.DAILY);
      // APY = (1 + 1/365)^365 - 1 ≈ 171.4%
      expect(apy).toBeGreaterThan(171);
      expect(apy).toBeLessThan(172);
    });
  });

  describe('mapVaultToResponse — APY integration', () => {
    it('should include apr and apy in the response', () => {
      const vault = {
        ...mockVault,
        interestRate: 5,
        strategy: null,
      } as any;

      const response = service.mapVaultToResponse(vault);

      expect(response.apr).toBe(5);
      expect(response.apy).toBeCloseTo(5.13, 1);
      expect(response.interestRate).toBe(5);
    });

    it('should use vault strategy compounding frequency for APY', () => {
      const vault = {
        ...mockVault,
        interestRate: 5,
        strategy: { compoundingFrequency: CompoundingFrequency.MONTHLY },
      } as any;

      const response = service.mapVaultToResponse(vault);

      expect(response.apr).toBe(5);
      expect(response.apy).toBeCloseTo(5.12, 1);
    });

    it('should fallback to daily compounding when no strategy', () => {
      const vault = {
        ...mockVault,
        interestRate: 5,
        strategy: null,
      } as any;

      const response = service.mapVaultToResponse(vault);

      expect(response.apy).toBeCloseTo(5.13, 1);
    });
  });

  describe('recordApySnapshot', () => {
    it('should create an APY history snapshot for a vault', async () => {
      const vault = {
        ...mockVault,
        interestRate: 5,
        strategy: null,
      } as any;

      mockVaultRepository.findOne.mockResolvedValue(vault);
      mockDataSource.createQueryBuilder.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      });

      await service.recordApySnapshot('vault-1');

      expect(mockDataSource.createQueryBuilder).toHaveBeenCalled();
    });

    it('should store correct APY value in snapshot', async () => {
      const vault = {
        ...mockVault,
        interestRate: 5,
        strategy: null,
      } as any;

      mockVaultRepository.findOne.mockResolvedValue(vault);

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      mockDataSource.createQueryBuilder.mockReturnValue(mockInsert);

      await service.recordApySnapshot('vault-1');

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          apy: expect.any(Number),
        }),
      );
    });

    it('should not throw when vault does not exist', async () => {
      mockVaultRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordApySnapshot('nonexistent'),
      ).resolves.not.toThrow();
    });
  });

  describe('getApyHistory', () => {
    it('should return APY history from database', async () => {
      const mockHistory = [
        {
          id: '1',
          vaultId: 'vault-1',
          apy: 5.13,
          snapshotDate: new Date('2024-01-01'),
          createdAt: new Date(),
        },
      ];

      const mockQB = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockHistory),
      };

      mockVaultApyHistoryRepository.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getApyHistory('vault-1', '30d');

      expect(result).toHaveLength(1);
      expect(result[0].apy).toBe(5.13);
      expect(result[0].vaultId).toBe('vault-1');
    });

    it('should filter by vaultId when provided', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockVaultApyHistoryRepository.createQueryBuilder.mockReturnValue(mockQB);

      await service.getApyHistory('vault-1', '30d');

      expect(mockQB.andWhere).toHaveBeenCalledWith(
        'history.vaultId = :vaultId',
        { vaultId: 'vault-1' },
      );
    });

  // ---------------------------------------------------------------------------
  // getUserVaults
  // ---------------------------------------------------------------------------
  describe('getUserVaults', () => {
    it('should return mapped vaults for a user', async () => {
      mockVaultRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockVault]),
      });

      const result = await service.getUserVaults('user-1');

      expect(result.vaults).toHaveLength(1);
      expect(result.vaults[0]).toHaveProperty('id', 'vault-1');
      expect(result.nextCursor).toBeNull();
    });

    it('should return empty array when user has no vaults', async () => {
      mockVaultRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getUserVaults('user-no-vaults');

      expect(result.vaults).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getPublicVaults
  // ---------------------------------------------------------------------------
  describe('getPublicVaults', () => {
    it('should return paginated public vaults', async () => {
      mockVaultRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockVault]),
      });

      const result = await service.getPublicVaults({ limit: 20 });

      expect(result.vaults).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getVaultsMetadata
  // ---------------------------------------------------------------------------
  describe('getVaultsMetadata', () => {
    it('should return name, symbol, and assetPair for each public vault', async () => {
      mockVaultRepository.find.mockResolvedValue([
        {
          vaultName: 'Test Vault',
          symbol: 'TEST',
          assetPair: 'XLM/USDC',
        },
      ]);

      const result = await service.getVaultsMetadata();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Test Vault',
        symbol: 'TEST',
        assetPair: 'XLM/USDC',
      });
    });

    it('should return empty array when no public vaults exist', async () => {
      mockVaultRepository.find.mockResolvedValue([]);

      const result = await service.getVaultsMetadata();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // pauseVault
  // ---------------------------------------------------------------------------
  describe('pauseVault', () => {
    it('should set vault status to FROZEN', async () => {
      const frozenVault = { ...mockVault, status: VaultStatus.FROZEN };
      mockVaultRepository.findOne
        .mockResolvedValueOnce(mockVault) // first getVaultById
        .mockResolvedValueOnce(frozenVault); // after update
      mockVaultRepository.update.mockResolvedValue(undefined);

      const result = await service.pauseVault('vault-1', 'user-1');

      expect(mockVaultRepository.update).toHaveBeenCalledWith('vault-1', {
        status: VaultStatus.FROZEN,
      });
      expect(result.status).toBe(VaultStatus.FROZEN);
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const otherOwnerVault = { ...mockVault, ownerId: 'owner-2' };
      mockVaultRepository.findOne.mockResolvedValue(otherOwnerVault);

      // Stub dataSource.getRepository to return a mock user repo that returns no admin
      mockDataSource.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ role: 'FARMER' }),
      } as any);

      await expect(
        service.pauseVault('vault-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if vault is already paused', async () => {
      const frozenVault = { ...mockVault, status: VaultStatus.FROZEN };
      mockVaultRepository.findOne.mockResolvedValue(frozenVault);

      await expect(
        service.pauseVault('vault-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.pauseVault('vault-1', 'user-1'),
      ).rejects.toThrow('Vault is already paused');
    });
  });

  // ---------------------------------------------------------------------------
  // resumeVault
  // ---------------------------------------------------------------------------
  describe('resumeVault', () => {
    it('should set vault status back to ACTIVE', async () => {
      const frozenVault = { ...mockVault, status: VaultStatus.FROZEN };
      const activeVault = { ...mockVault, status: VaultStatus.ACTIVE };
      mockVaultRepository.findOne
        .mockResolvedValueOnce(frozenVault)
        .mockResolvedValueOnce(activeVault);
      mockVaultRepository.update.mockResolvedValue(undefined);

      const result = await service.resumeVault('vault-1', 'user-1');

      expect(mockVaultRepository.update).toHaveBeenCalledWith('vault-1', {
        status: VaultStatus.ACTIVE,
      });
      expect(result.status).toBe(VaultStatus.ACTIVE);
    });

    it('should throw BadRequestException if vault is not paused', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault); // ACTIVE

      await expect(
        service.resumeVault('vault-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resumeVault('vault-1', 'user-1'),
      ).rejects.toThrow('Vault is not paused');
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const frozenVault = { ...mockVault, ownerId: 'owner-2', status: VaultStatus.FROZEN };
      mockVaultRepository.findOne.mockResolvedValue(frozenVault);
      mockDataSource.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ role: 'FARMER' }),
      } as any);

      await expect(
        service.resumeVault('vault-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateVaultMultiSignatureConfig
  // ---------------------------------------------------------------------------
  describe('updateVaultMultiSignatureConfig', () => {
    it('should update multi-signature config for the vault owner', async () => {
      const updatedVault = { ...mockVault, requiresMultiSignature: true, approvalThreshold: 3 };
      mockVaultRepository.findOne
        .mockResolvedValueOnce(mockVault)
        .mockResolvedValueOnce(updatedVault);
      mockVaultRepository.update.mockResolvedValue(undefined);

      const result = await service.updateVaultMultiSignatureConfig(
        'vault-1',
        'user-1',
        true,
        3,
      );

      expect(mockVaultRepository.update).toHaveBeenCalledWith(
        'vault-1',
        expect.objectContaining({ requiresMultiSignature: true, approvalThreshold: 3 }),
      );
      expect(result.requiresMultiSignature).toBe(true);
    });

    it('should throw UnauthorizedException for non-owner, non-admin', async () => {
      const otherOwnerVault = { ...mockVault, ownerId: 'owner-2' };
      mockVaultRepository.findOne.mockResolvedValue(otherOwnerVault);
      mockDataSource.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ role: 'FARMER' }),
      } as any);

      await expect(
        service.updateVaultMultiSignatureConfig('vault-1', 'user-1', true, 2),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for approval threshold < 1', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);

      await expect(
        service.updateVaultMultiSignatureConfig('vault-1', 'user-1', true, 0),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVaultMultiSignatureConfig('vault-1', 'user-1', true, 0),
      ).rejects.toThrow('Approval threshold must be between 1 and 10');
    });

    it('should throw BadRequestException for approval threshold > 10', async () => {
      mockVaultRepository.findOne.mockResolvedValue(mockVault);

      await expect(
        service.updateVaultMultiSignatureConfig('vault-1', 'user-1', true, 11),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // getApyHistory
  // ---------------------------------------------------------------------------
  describe('getApyHistory', () => {
    it('should return APY history for default 30 days', async () => {
      const result = await service.getApyHistory();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(30);
    });

    it('should return APY history for a specific vault', async () => {
      const result = await service.getApyHistory('vault-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('vaultId', 'vault-1');
    });

    it('should return 7 data points for 7d range', async () => {
      const result = await service.getApyHistory(undefined, '7d');
      expect(result).toHaveLength(7);
    });

    it('should return 90 data points for 90d range', async () => {
      const result = await service.getApyHistory(undefined, '90d');
      expect(result).toHaveLength(90);
    });

    it('should return 365 data points for all-time range', async () => {
      const result = await service.getApyHistory(undefined, 'all');
      expect(result).toHaveLength(365);
    });

    it('should return 30 data points for unknown range (default fallback)', async () => {
      const result = await service.getApyHistory(undefined, 'unknown-range');
      expect(result).toHaveLength(30);
    });

    it('each data point should have date, apy, and vaultId fields', async () => {
      const result = await service.getApyHistory('vault-1', '7d');
      for (const point of result) {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('apy');
        expect(point).toHaveProperty('vaultId');
        expect(typeof point.apy).toBe('number');
        expect(point.apy).toBeGreaterThanOrEqual(0);
        expect(point.apy).toBeLessThanOrEqual(15);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getDepositEventHistory / getUserDepositEventHistory / getVaultDepositEventHistory
  // ---------------------------------------------------------------------------
  describe('deposit event history methods', () => {
    it('getDepositEventHistory should return mapped events', async () => {
      const fakeEvent = { id: 'ev-1', depositId: 'dep-1' };
      mockDepositEventService.getDepositHistory.mockResolvedValue([fakeEvent]);
      mockDepositEventService.mapEventToResponse.mockReturnValue(fakeEvent);

      const result = await service.getDepositEventHistory('dep-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fakeEvent);
    });

    it('getUserDepositEventHistory should return events for a user', async () => {
      const fakeEvent = { id: 'ev-2', depositId: 'dep-2' };
      mockDepositEventService.getUserDepositHistory.mockResolvedValue([fakeEvent]);
      mockDepositEventService.mapEventToResponse.mockReturnValue(fakeEvent);

      const result = await service.getUserDepositEventHistory('user-1');

      expect(result).toHaveLength(1);
      expect(mockDepositEventService.getUserDepositHistory).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
    });

    it('getUserDepositEventHistory should pass vaultId filter when provided', async () => {
      mockDepositEventService.getUserDepositHistory.mockResolvedValue([]);

      await service.getUserDepositEventHistory('user-1', 'vault-1');

      expect(mockDepositEventService.getUserDepositHistory).toHaveBeenCalledWith(
        'user-1',
        'vault-1',
      );
    });

    it('getVaultDepositEventHistory should return events for a vault', async () => {
      const fakeEvent = { id: 'ev-3', vaultId: 'vault-1' };
      mockDepositEventService.getVaultDepositHistory.mockResolvedValue([fakeEvent]);
      mockDepositEventService.mapEventToResponse.mockReturnValue(fakeEvent);

      const result = await service.getVaultDepositEventHistory('vault-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('calculateApy', () => {
    it('should correctly calculate APY with daily compounding', () => {
      expect(service.calculateApy(5, 'daily')).toBe(5.13);
    });

    it('should correctly calculate APY with weekly compounding', () => {
      expect(service.calculateApy(5, 'weekly')).toBe(5.12);
    });

    it('should correctly calculate APY with monthly compounding', () => {
      expect(service.calculateApy(5, 'monthly')).toBe(5.12);
    });
  });

  });
});
