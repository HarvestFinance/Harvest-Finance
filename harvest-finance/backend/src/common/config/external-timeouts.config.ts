/**
 * Configurable timeouts for all external API calls.
 *
 * Each value is read from an environment variable with a sensible default.
 * Import this in any service that makes outbound HTTP calls to ensure
 * consistent, production-safe timeouts without hardcoded magic numbers.
 */
export function getExternalTimeouts() {
  return {
    /** Stellar Horizon HTTP request timeout (ms). */
    stellarHorizon: parseInt(process.env.STELLAR_HTTP_TIMEOUT_MS || '30000', 10),
    /** Soroban RPC JSON-RPC request timeout (ms). */
    sorobanRpc: parseInt(process.env.SOROBAN_RPC_TIMEOUT_MS || '15000', 10),
    /** IPFS upload timeout (ms). */
    ipfsUpload: parseInt(process.env.IPFS_UPLOAD_TIMEOUT_MS || '60000', 10),
    /** IPFS read/cat timeout (ms). */
    ipfsCat: parseInt(process.env.IPFS_CAT_TIMEOUT_MS || '30000', 10),
    /** Price oracle HTTP timeout (ms). */
    priceOracle: parseInt(process.env.PRICE_ORACLE_TIMEOUT_MS || '5000', 10),
    /** Generic outbound HTTP default timeout (ms). */
    default: parseInt(process.env.EXTERNAL_HTTP_TIMEOUT_MS || '30000', 10),
  };
}
