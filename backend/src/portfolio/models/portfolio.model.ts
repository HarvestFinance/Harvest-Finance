import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class AssetBalance {
  @Field(() => String)
  assetCode: string;

  @Field(() => String, { nullable: true })
  assetIssuer?: string | null;

  @Field(() => String)
  balance: string;
}

@ObjectType()
export class StellarAccountSnapshot {
  @Field(() => String)
  publicKey: string;

  @Field()
  exists: boolean;

  @Field(() => [AssetBalance])
  balances: AssetBalance[];

  @Field(() => String, { nullable: true })
  error?: string | null;
}

@ObjectType()
export class VaultHolding {
  @Field(() => String)
  vaultId: string;

  @Field(() => String)
  vaultName: string;

  @Field(() => String)
  vaultType: string;

  @Field(() => Float)
  balance: number;
}

@ObjectType()
export class PortfolioResponse {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  generatedAt: string;

  @Field(() => [StellarAccountSnapshot])
  accounts: StellarAccountSnapshot[];

  @Field(() => [AssetBalance])
  aggregatedStellarBalances: AssetBalance[];

  @Field(() => [VaultHolding])
  vaults: VaultHolding[];

  @Field(() => Float)
  totalVaultBalance: number;
}
