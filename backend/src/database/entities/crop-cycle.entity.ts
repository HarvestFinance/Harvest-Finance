import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('crop_cycles')
export class CropCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Seasonal yield rate (e.g., 0.15 for 15%)',
  })
  yieldRate: number;

  @Column({ type: 'integer' })
  durationDays: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 50, default: 'Sprout' })
  icon: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('FarmVault', 'cropCycle')
  vaults: any[];
}
