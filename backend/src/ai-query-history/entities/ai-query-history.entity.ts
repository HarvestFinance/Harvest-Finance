import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Entity('ai_query_history')
export class AiQueryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ name: 'vault_context', type: 'jsonb', nullable: true })
  vaultContext: Record<string, any> | null;

  @Column({ name: 'seasonal_data', type: 'jsonb', nullable: true })
  seasonalData: Record<string, any> | null;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
