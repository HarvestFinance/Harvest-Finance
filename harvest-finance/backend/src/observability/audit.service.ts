import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { AuditEvent } from '../database/entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepository: Repository<AuditEvent>,
    private readonly dataSource: DataSource,
  ) {}

  async logEvent(
    type: string,
    action: string,
    userId: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<AuditEvent> {
    return this.dataSource.transaction(async (manager) => {
      // Get the last event to link the hash chain
      // Lock the row or just get the latest. For strict ordering, table lock or a sequence might be needed.
      const lastEvent = await manager
        .createQueryBuilder(AuditEvent, 'audit')
        .orderBy('audit.createdAt', 'DESC')
        .addOrderBy('audit.id', 'DESC') // fallback
        .setLock('pessimistic_write') // prevent race conditions in the hash chain
        .getOne();

      const previousHash = lastEvent?.hash || null;
      
      const payload = JSON.stringify({
        type,
        action,
        userId,
        metadata: metadata || {},
        previousHash,
      });
      
      const hash = createHash('sha256').update(payload).digest('hex');

      const event = manager.create(AuditEvent, {
        type,
        action,
        userId,
        metadata,
        previousHash,
        hash,
      });

      return manager.save(event);
    });
  }

  async verifyChain(): Promise<boolean> {
    const events = await this.auditRepository.find({
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    let expectedPreviousHash: string | null = null;

    for (const event of events) {
      if (event.previousHash !== expectedPreviousHash) {
        return false;
      }

      const payload = JSON.stringify({
        type: event.type,
        action: event.action,
        userId: event.userId,
        metadata: event.metadata || {},
        previousHash: event.previousHash,
      });

      const hash = createHash('sha256').update(payload).digest('hex');

      if (event.hash !== hash) {
        return false;
      }

      expectedPreviousHash = hash;
    }

    return true;
  }
}
