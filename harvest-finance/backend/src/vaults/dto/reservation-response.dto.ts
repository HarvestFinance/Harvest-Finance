import { ApiProperty } from '@nestjs/swagger';

const EXAMPLE_VAULT_ID = '550e8400-e29b-41d4-a716-446655440000';
const EXAMPLE_STELLAR_WALLET =
  'GD3BFFX7DTNJAGDVVM5RYGGQQNURZTH4VSBLWF55YXY3L6T2WWZK57EI';

export class ReservationResponseDto {
  /** Unique identifier of the deposit reservation. */
  @ApiProperty({
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    description: 'Unique reservation identifier (UUID)',
  })
  id: string;

  /** Identifier of the vault the reservation was placed against. */
  @ApiProperty({
    example: EXAMPLE_VAULT_ID,
    description: 'Vault the reservation belongs to',
  })
  vaultId: string;

  /**
   * Wallet that will fund the reservation. Synthetic Stellar account
   * identifiers are used in examples — never real user wallets.
   */
  @ApiProperty({
    example: EXAMPLE_STELLAR_WALLET,
    description: 'Wallet address holding the reserved funds',
  })
  walletAddress: string;

  /** Amount held aside by this reservation, in the vault asset. */
  @ApiProperty({
    example: 125.5,
    description: 'Amount reserved for later settlement, in the vault asset',
  })
  reservedAmount: number;

  /** Point in time after which the reservation lapses and releases funds. */
  @ApiProperty({
    example: '2026-08-24T12:00:00.000Z',
    description: 'ISO 8601 UTC timestamp after which the reservation expires',
    type: String,
    format: 'date-time',
  })
  expiresAt: Date;

  /** Whether the reservation can still be settled. */
  @ApiProperty({
    example: true,
    description: 'Whether the reservation is still active and settleable',
  })
  isActive: boolean;

  /** When the reservation was created. */
  @ApiProperty({
    example: '2026-08-24T10:00:00.000Z',
    description: 'ISO 8601 UTC timestamp of reservation creation',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}
