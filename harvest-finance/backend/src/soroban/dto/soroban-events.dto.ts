import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { SorobanEventType } from '../../database/entities/soroban-event.entity';

export class QuerySorobanEventsDto {
  @ApiPropertyOptional({
    description: 'Filter by contract ID (C-address)',
    example: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  contractId?: string;

  @ApiPropertyOptional({
    enum: SorobanEventType,
    description: 'Filter by event type',
  })
  @IsOptional()
  @IsEnum(SorobanEventType)
  type?: SorobanEventType;

  @ApiPropertyOptional({
    description: 'Minimum ledger sequence (inclusive)',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fromLedger?: number;

  @ApiPropertyOptional({
    description: 'Maximum ledger sequence (inclusive)',
    example: 200000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  toLedger?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Max records to return (1-100)',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class SorobanEventDto {
  /** Internal database identifier of the indexed event. */
  @ApiProperty({
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    description: 'Internal identifier of the indexed event',
  })
  id: string;

  /**
   * Soroban event identifier as reported by the RPC (contract-generated
   * topic hash combined with ledger coordinates).
   */
  @ApiProperty({
    example: 'AAAAEgAAAAMzNDAwMDAAAAAAAAAAAAAAeNDI1NjAwMDA',
    description: 'Stellar RPC event identifier',
  })
  eventId: string;

  @ApiProperty({
    enum: SorobanEventType,
    example: SorobanEventType.CONTRACT,
    description: 'Contract event classification used for filtering',
  })
  type: SorobanEventType;

  /** Contract that emitted the event, as a C-address. */
  @ApiProperty({
    nullable: true,
    example: 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
    description: 'Soroban contract ID (C-address) that emitted the event',
  })
  contractId: string | null;

  @ApiProperty({
    example: 456789,
    description: 'Ledger sequence in which the event was emitted',
  })
  ledger: number;

  @ApiProperty({
    example: '2026-08-24T10:15:00.000Z',
    description: 'ISO 8601 UTC close time of the ledger containing the event',
    type: String,
    format: 'date-time',
  })
  ledgerClosedAt: Date;

  @ApiProperty({
    nullable: true,
    example: '4c1143892809f6e622b07541604a8b75c3dbb9fa64dfbc8813a30eb6a58a74e5',
    description: 'Hash of the transaction that emitted the event',
  })
  transactionHash: string | null;

  /** Horizon-style cursor used to resume paginated queries. */
  @ApiProperty({
    example: '456789-3',
    description: 'Paging token for resuming iteration at this event',
  })
  pagingToken: string;

  /** Contract-declared topic values identifying the event kind. */
  @ApiProperty({
    type: [String],
    example: ['deposit', 'AAAABQ=='],
    description: 'Event topics as emitted by the contract',
  })
  topics: string[];

  /** Decoded event payload; shape depends on the contract and event type. */
  @ApiProperty({
    required: false,
    nullable: true,
    example: {
      vault_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: '100',
    },
    description:
      'Decoded event payload. Structure depends on the emitting contract.',
  })
  value: unknown;

  @ApiProperty({
    example: true,
    description: 'Whether the wrapping transaction succeeded',
  })
  inSuccessfulContractCall: boolean;

  @ApiProperty({
    example: '2026-08-24T10:16:30.000Z',
    description: 'ISO 8601 UTC timestamp at which this record was indexed',
    type: String,
    format: 'date-time',
  })
  indexedAt: Date;
}

export class SorobanEventPageDto {
  @ApiProperty({ type: [SorobanEventDto] })
  items: SorobanEventDto[];

  @ApiProperty({ example: 123 })
  total: number;

  @ApiProperty({ example: 0 })
  skip: number;

  @ApiProperty({ example: 50 })
  limit: number;
}

export class IndexerStatusDto {
  @ApiProperty({ example: true, description: 'Whether the indexer is enabled' })
  enabled: boolean;

  @ApiProperty({
    example: 'https://soroban-testnet.stellar.org',
    description: 'Soroban RPC URL',
  })
  rpcUrl: string;

  @ApiProperty({
    example: 123456,
    nullable: true,
    description: 'Last ledger sequence indexed',
  })
  lastLedger: number | null;

  @ApiProperty({
    example: 123456,
    nullable: true,
    description: 'Total events indexed',
  })
  totalEvents: number;

  @ApiProperty({
    example: '2026-04-24T12:00:00.000Z',
    nullable: true,
    description: 'Last successful poll timestamp',
  })
  lastPolledAt: string | null;
}
