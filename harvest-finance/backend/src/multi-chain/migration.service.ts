import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ethers } from 'ethers';
import { Keypair } from '@stellar/stellar-sdk';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { SecurityEvent, SecurityEventType } from '../database/entities/security-event.entity';
import { User } from '../database/entities/user.entity';
import { DomainEventNames } from '../domain-events/domain-event-names';
import { MigrationCreatedEvent } from '../domain-events/events/migration-created.event';
import { MigratePositionDto } from './dto/migrate-position.dto';
import { ChainRegistryService } from './adapters/chain-registry.service';

@Injectable()
export class MigrationService {
  constructor(
    private readonly registry: ChainRegistryService,
    private readonly events: EventEmitter2,
    @InjectRepository(SecurityEvent)
    private readonly securityEvents: Repository<SecurityEvent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async createMigration(userId: string, request: MigratePositionDto) {
    const sourceChain = request.sourceChain.toLowerCase();
    const destinationChain = request.destinationChain.toLowerCase();
    const sourceAdapter = this.registry.get(sourceChain);
    const destinationAdapter = this.registry.get(destinationChain);

    if (!sourceAdapter || !destinationAdapter || sourceChain === destinationChain) {
      throw new BadRequestException('Source and destination chains must be registered and different');
    }

    const user = await this.users.findOne({ where: { id: userId } });
    const expectedAddress = this.walletForChain(user, sourceChain);
    if (!expectedAddress || expectedAddress.toLowerCase() !== request.sourceAddress.toLowerCase()) {
      throw new UnauthorizedException('Source address is not linked to the authenticated user');
    }

    const message = this.canonicalMessage(userId, request);
    if (!this.verifySignature(sourceChain, request.sourceAddress, message, request.signature, request.signatureEncoding)) {
      throw new UnauthorizedException('Invalid migration signature');
    }

    const migrationId = randomUUID();
    await this.securityEvents.save(this.securityEvents.create({
      userId,
      type: SecurityEventType.MIGRATION_CREATED,
      message: `Cross-chain migration ${migrationId} created`,
      metadata: {
        migrationId,
        sourceChain,
        sourcePositionId: request.sourcePositionId,
        destinationChain,
        destinationPositionId: request.destinationPositionId,
        amount: request.amount,
        sourceAddress: request.sourceAddress,
      },
    }));

    this.events.emit(
      DomainEventNames.MIGRATION_CREATED,
      new MigrationCreatedEvent(migrationId, userId, sourceChain, destinationChain, request.amount),
    );

    return { migrationId, status: 'pending', sourceChain, destinationChain, amount: request.amount };
  }

  private canonicalMessage(userId: string, request: MigratePositionDto): string {
    return JSON.stringify({
      userId,
      sourceChain: request.sourceChain.toLowerCase(),
      sourcePositionId: request.sourcePositionId,
      destinationChain: request.destinationChain.toLowerCase(),
      destinationPositionId: request.destinationPositionId,
      amount: request.amount,
      sourceAddress: request.sourceAddress,
    });
  }

  private verifySignature(
    chain: string,
    address: string,
    message: string,
    signature: string,
    encoding: 'base64' | 'hex',
  ): boolean {
    try {
      if (chain === 'ethereum' || chain === 'polygon') {
        return ethers.verifyMessage(message, signature).toLowerCase() === address.toLowerCase();
      }
      if (chain === 'stellar') {
        const bytes = Buffer.from(signature, encoding);
        return Keypair.fromPublicKey(address).verify(Buffer.from(message), bytes);
      }
      return false;
    } catch {
      return false;
    }
  }

  private walletForChain(user: User | null, chain: string): string | null {
    if (!user) return null;
    const wallets: Record<string, string | null | undefined> = {
      stellar: user.stellarAddress,
      ethereum: user.ethereumAddress,
      polygon: user.polygonAddress,
      solana: user.solanaAddress,
    };
    return wallets[chain] ?? null;
  }
}
