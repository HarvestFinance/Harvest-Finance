import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditEventType {
  VAULT_CREATED = 'VAULT_CREATED',
  FUNDS_WITHDRAWN = 'FUNDS_WITHDRAWN',
  ROLE_CHANGED = 'ROLE_CHANGED',
  SYSTEM_CONFIG_UPDATED = 'SYSTEM_CONFIG_UPDATED',
}

@Entity('audit_events')
@Index('idx_audit_events_created_at', ['createdAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar' })
  type: string;

  @Column('text')
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'previous_hash', type: 'varchar', nullable: true })
  previousHash: string | null;

  @Column({ name: 'hash', type: 'varchar', nullable: false })
  hash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
