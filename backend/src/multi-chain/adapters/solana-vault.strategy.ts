/**
 * Configured SPL vault strategy exposed via SOLANA_VAULT_STRATEGIES (JSON array).
 */
export interface SolanaVaultStrategy {
  /** SPL token mint address (base58). */
  mint: string;
  /** Human-friendly vault label for UIs. */
  name: string;
  /** Token symbol shown in yield reports (e.g. USDC). */
  assetCode: string;
  /** APR in percent, or omitted when unknown. */
  apr?: number;
}

export function parseSolanaVaultStrategies(
  raw: string | undefined,
): SolanaVaultStrategy[] {
  if (!raw?.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          entry != null && typeof entry === 'object',
      )
      .map((entry) => ({
        mint: typeof entry.mint === 'string' ? entry.mint.trim() : '',
        name:
          typeof entry.name === 'string' ? entry.name.trim() : 'Solana Vault',
        assetCode:
          typeof entry.assetCode === 'string' ? entry.assetCode.trim() : 'SPL',
        apr:
          entry.apr != null && !Number.isNaN(Number(entry.apr))
            ? Number(entry.apr)
            : undefined,
      }))
      .filter((s) => s.mint.length > 0);
  } catch {
    return [];
  }
}
