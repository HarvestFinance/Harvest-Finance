import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum InsurancePlanType {
  CROP_YIELD = 'CROP_YIELD',
  WEATHER_INDEX = 'WEATHER_INDEX',
  MARKET_PRICE = 'MARKET_PRICE',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

@Entity('insurance_plans')
export class InsurancePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: InsurancePlanType,
    name: 'plan_type',
  })
  planType: InsurancePlanType;

  /** Applicable risk levels for this plan (stored as comma-separated enum values) */
  @Column({ type: 'text', name: 'applicable_risk_levels' })
  applicableRiskLevels: string;

  /** Crop types this plan covers (comma-separated, empty = all crops) */
  @Column({ type: 'text', name: 'applicable_crops', nullable: true })
  applicableCrops: string | null;

  /**
   * Annual premium rate as a fraction of insured value.
   * E.g. 0.035 = 3.5 % per year.
   */
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 4,
    name: 'premium_rate',
  })
  premiumRate: number;

  /**
   * Coverage multiplier: payout = insured value × coverageMultiplier.
   * Typically 0.5 – 1.0.
   */
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'coverage_multiplier',
    default: 1.0,
  })
  coverageMultiplier: number;

  @Column({ length: 120, name: 'provider_name' })
  providerName: string;

  @Column({ type: 'varchar', length: 200, name: 'provider_contact', nullable: true })
  providerContact: string | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('InsuranceSubscription', 'plan')
  subscriptions: any[];
}
