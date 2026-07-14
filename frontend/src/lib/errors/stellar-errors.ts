/**
 * Stellar specific error codes and their human-readable translations.
 */
export const STELLAR_ERROR_MAP: Record<string, string> = {
  // Transaction results
  tx_failed: "The transaction failed. Please try again later.",
  tx_bad_auth: "Authentication failed. Please check your wallet connection.",
  tx_insufficient_balance: "Insufficient balance to cover transaction and fees.",
  tx_no_source_account: "The source account does not exist. It may need to be funded first.",
  tx_insufficient_fee: "The network fee is too low for the current traffic.",
  tx_bad_seq: "There was a sequence number mismatch. Please refresh and try again.",

  // Operation results
  op_underfunded: "You don't have enough funds to complete this transaction.",
  op_low_reserve: "This transaction would drop your balance below the minimum required reserve.",
  op_no_trust: "You don't have a trustline for this asset. Please add it first.",
  op_invalid_limit: "The trustline limit is invalid.",
  op_no_destination: "The destination account does not exist.",
  op_sell_no_trust: "You cannot sell an asset you don't have a trustline for.",
  op_buy_no_trust: "You cannot buy an asset you don't have a trustline for.",
  op_sell_not_authorized: "This account is not authorized to sell this asset.",
  op_buy_not_authorized: "This account is not authorized to buy this asset.",
  op_line_full: "The destination trustline is full and cannot receive more of this asset.",
  op_no_issuer: "The asset issuer does not exist.",
  
  // Custom platform errors
  wallet_not_found: "Freighter wallet not found. Please install the extension.",
  user_cancelled: "Transaction was cancelled by the user.",
  network_error: "Unable to connect to the network. Please check your connection.",
  timeout: "The transaction timed out. Please try again.",
};

/**
 * Fallback message for unknown errors.
 */
export const DEFAULT_ERROR_MESSAGE = "Something went wrong with the transaction. Please try again.";

/**
 * Interface for parsed Stellar errors.
 */
export interface ParsedStellarError {
  message: string;
  code: string;
  originalError?: any;
  isStellarError: boolean;
}

/**
 * Parses an error object (Stellar SDK or Freighter) and returns a human-readable message.
 */
export function parseStellarError(error: any): ParsedStellarError {
  if (!error) {
    return {
      message: DEFAULT_ERROR_MESSAGE,
      code: "unknown",
      isStellarError: false
    };
  }

  // Handle Freighter/User cancellation
  if (error === "User cancelled" || error.message === "User cancelled") {
    return {
      message: STELLAR_ERROR_MAP.user_cancelled,
      code: "user_cancelled",
      originalError: error,
      isStellarError: true
    };
  }

  // Handle Stellar SDK result codes in nested objects
  // Often in error.response.data.extras.result_codes
  const resultCodes = error.response?.data?.extras?.result_codes;
  if (resultCodes) {
    const code = resultCodes.transaction || (resultCodes.operations && resultCodes.operations[0]);
    if (code && STELLAR_ERROR_MAP[code]) {
      return {
        message: STELLAR_ERROR_MAP[code],
        code,
        originalError: error,
        isStellarError: true
      };
    }
  }

  // Handle direct message matching for common patterns
  const errorMessage = error.message?.toLowerCase() || "";
  for (const [code, translation] of Object.entries(STELLAR_ERROR_MAP)) {
    if (errorMessage.includes(code.toLowerCase())) {
      return {
        message: translation,
        code,
        originalError: error,
        isStellarError: true
      };
    }
  }

  // Final fallback
  return {
    message: error.message || DEFAULT_ERROR_MESSAGE,
    code: "unknown",
    originalError: error,
    isStellarError: false
  };
}
