import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { CropCycle } from './crop-cycle.entity';

export enum FarmVaultStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('farm_vaults')
@Index('idx_farm_vaults_user', ['userId'])
export class FarmVault {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  balance: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    name: 'target_amount',
    default: 0,
  })
  targetAmount: number;

  @Column({ name: 'crop_cycle_id' })
  cropCycleId: string;

  @Column({
    type: 'enum',
    enum: FarmVaultStatus,
    default: FarmVaultStatus.ACTIVE,
  })
  status: FarmVaultStatus;

  @Column({ type: 'timestamp with time zone', name: 'start_date' })
  startDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CropCycle, (cycle) => cycle.vaults)
  @JoinColumn({ name: 'crop_cycle_id' })
  cropCycle: CropCycle;
}
