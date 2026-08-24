import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export enum SorobanErrorCode {
  TIMEOUT = 'timeout',
  RPC_INVALID_REQUEST = 'rpc_invalid_request',
  RPC_METHOD_NOT_FOUND = 'rpc_method_not_found',
  RPC_INVALID_PARAMS = 'rpc_invalid_params',
  RPC_INTERNAL_ERROR = 'rpc_internal_error',
  TRY_AGAIN_LATER = 'try_again_later',
  TX_FAILED = 'tx_failed',
  TX_MALFORMED = 'tx_malformed',
  TX_BAD_SEQ = 'tx_bad_seq',
  TX_BAD_AUTH = 'tx_bad_auth',
  TX_BAD_AUTH_EXTRA = 'tx_bad_auth_extra',
  TX_INSUFFICIENT_BALANCE = 'tx_insufficient_balance',
  TX_NO_SOURCE_ACCOUNT = 'tx_no_source_account',
  TX_INSUFFICIENT_FEE = 'tx_insufficient_fee',
  TX_INTERNAL_ERROR = 'tx_internal_error',
  TX_SOROBAN_INVALID = 'tx_soroban_invalid',
  HOST_INVALID_INPUT = 'host_invalid_input',
  HOST_AUTH = 'host_auth',
  HOST_RESOURCE_LIMIT_EXCEEDED = 'host_resource_limit_exceeded',
  HOST_STORAGE_MISSING_VALUE = 'host_storage_missing_value',
  INVOKE_HOST_FUNCTION_TRAPPED = 'invoke_host_function_trapped',
  INVOKE_HOST_FUNCTION_ENTRY_ARCHIVED = 'invoke_host_function_entry_archived',
  INVOKE_HOST_FUNCTION_RESOURCE_LIMIT_EXCEEDED = 'invoke_host_function_resource_limit_exceeded',
  RESTORE_FOOTPRINT_MALFORMED = 'restore_footprint_malformed',
  EXTEND_FOOTPRINT_TTL_MALFORMED = 'extend_footprint_ttl_malformed',
}

export const ERROR_MAP: Record<SorobanErrorCode, HttpStatus> = {
  [SorobanErrorCode.TIMEOUT]: HttpStatus.REQUEST_TIMEOUT,
  [SorobanErrorCode.RPC_INVALID_REQUEST]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.RPC_METHOD_NOT_FOUND]: HttpStatus.BAD_GATEWAY,
  [SorobanErrorCode.RPC_INVALID_PARAMS]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.RPC_INTERNAL_ERROR]: HttpStatus.BAD_GATEWAY,
  [SorobanErrorCode.TRY_AGAIN_LATER]: HttpStatus.SERVICE_UNAVAILABLE,
  [SorobanErrorCode.TX_FAILED]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_MALFORMED]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_BAD_SEQ]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_BAD_AUTH]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_BAD_AUTH_EXTRA]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_INSUFFICIENT_BALANCE]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_NO_SOURCE_ACCOUNT]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_INSUFFICIENT_FEE]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_INTERNAL_ERROR]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.TX_SOROBAN_INVALID]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.HOST_INVALID_INPUT]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.HOST_AUTH]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.HOST_RESOURCE_LIMIT_EXCEEDED]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.HOST_STORAGE_MISSING_VALUE]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.INVOKE_HOST_FUNCTION_TRAPPED]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.INVOKE_HOST_FUNCTION_ENTRY_ARCHIVED]:
    HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.INVOKE_HOST_FUNCTION_RESOURCE_LIMIT_EXCEEDED]:
    HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.RESTORE_FOOTPRINT_MALFORMED]: HttpStatus.BAD_REQUEST,
  [SorobanErrorCode.EXTEND_FOOTPRINT_TTL_MALFORMED]: HttpStatus.BAD_REQUEST,
};

const ERROR_MESSAGE_MAP: Record<SorobanErrorCode, string> = {
  [SorobanErrorCode.TIMEOUT]: 'The transaction timed out. Please try again.',
  [SorobanErrorCode.RPC_INVALID_REQUEST]: 'Invalid Stellar RPC request.',
  [SorobanErrorCode.RPC_METHOD_NOT_FOUND]:
    'Requested Stellar RPC method is unavailable.',
  [SorobanErrorCode.RPC_INVALID_PARAMS]:
    'Invalid parameters provided to Stellar RPC.',
  [SorobanErrorCode.RPC_INTERNAL_ERROR]:
    'Stellar RPC returned an internal error.',
  [SorobanErrorCode.TRY_AGAIN_LATER]:
    'Stellar RPC is temporarily busy. Please try again shortly.',
  [SorobanErrorCode.TX_FAILED]: 'A blockchain transaction error occurred.',
  [SorobanErrorCode.TX_MALFORMED]: 'The blockchain transaction is malformed.',
  [SorobanErrorCode.TX_BAD_SEQ]:
    'The source account sequence number is out of date. Please retry with a fresh transaction.',
  [SorobanErrorCode.TX_BAD_AUTH]:
    'Transaction authorization failed. Please check your signature.',
  [SorobanErrorCode.TX_BAD_AUTH_EXTRA]:
    'The transaction contains unused signatures.',
  [SorobanErrorCode.TX_INSUFFICIENT_BALANCE]:
    'Insufficient account balance for the transaction.',
  [SorobanErrorCode.TX_NO_SOURCE_ACCOUNT]:
    'Source account was not found on the Stellar network.',
  [SorobanErrorCode.TX_INSUFFICIENT_FEE]:
    'The transaction fee is too low for the Stellar network.',
  [SorobanErrorCode.TX_INTERNAL_ERROR]:
    'The Stellar network returned an internal transaction error.',
  [SorobanErrorCode.TX_SOROBAN_INVALID]:
    'Invalid Soroban transaction data provided.',
  [SorobanErrorCode.HOST_INVALID_INPUT]:
    'Invalid input provided to the smart contract.',
  [SorobanErrorCode.HOST_AUTH]:
    'Transaction authorization failed. Please check your signature.',
  [SorobanErrorCode.HOST_RESOURCE_LIMIT_EXCEEDED]:
    'The smart contract exceeded allowed resource limits.',
  [SorobanErrorCode.HOST_STORAGE_MISSING_VALUE]:
    'Required smart contract storage was not found.',
  [SorobanErrorCode.INVOKE_HOST_FUNCTION_TRAPPED]:
    'Smart contract execution failed.',
  [SorobanErrorCode.INVOKE_HOST_FUNCTION_ENTRY_ARCHIVED]:
    'A required smart contract ledger entry is archived and must be restored.',
  [SorobanErrorCode.INVOKE_HOST_FUNCTION_RESOURCE_LIMIT_EXCEEDED]:
    'The smart contract exceeded allowed resource limits.',
  [SorobanErrorCode.RESTORE_FOOTPRINT_MALFORMED]:
    'The restore footprint operation is malformed.',
  [SorobanErrorCode.EXTEND_FOOTPRINT_TTL_MALFORMED]:
    'The extend footprint TTL operation is malformed.',
};

/**
 * Maps a raw code string to its canonical {@link SorobanErrorCode} alias.
 *
 * Keys are the *normalized* (see {@link normalizeErrorCode}) forms of every
 * known spelling — both full Stellar result codes (`tx_bad_seq`) and their
 * short aliases (`bad_seq`) — so callers can pass codes from Horizon
 * responses, RPC payloads, or SDK exceptions without pre-cleaning them.
 */
const KNOWN_ERROR_CODE_MAP: Readonly<Record<string, SorobanErrorCode>> = {
  timeout: SorobanErrorCode.TIMEOUT,
  tx_failed: SorobanErrorCode.TX_FAILED,
  failed: SorobanErrorCode.TX_FAILED,
  tx_malformed: SorobanErrorCode.TX_MALFORMED,
  malformed: SorobanErrorCode.TX_MALFORMED,
  tx_bad_seq: SorobanErrorCode.TX_BAD_SEQ,
  bad_seq: SorobanErrorCode.TX_BAD_SEQ,
  tx_bad_auth: SorobanErrorCode.TX_BAD_AUTH,
  bad_auth: SorobanErrorCode.TX_BAD_AUTH,
  auth_failed: SorobanErrorCode.HOST_AUTH,
  tx_bad_auth_extra: SorobanErrorCode.TX_BAD_AUTH_EXTRA,
  bad_auth_extra: SorobanErrorCode.TX_BAD_AUTH_EXTRA,
  tx_insufficient_balance: SorobanErrorCode.TX_INSUFFICIENT_BALANCE,
  insufficient_balance: SorobanErrorCode.TX_INSUFFICIENT_BALANCE,
  tx_no_source_account: SorobanErrorCode.TX_NO_SOURCE_ACCOUNT,
  no_source_account: SorobanErrorCode.TX_NO_SOURCE_ACCOUNT,
  tx_insufficient_fee: SorobanErrorCode.TX_INSUFFICIENT_FEE,
  insufficient_fee: SorobanErrorCode.TX_INSUFFICIENT_FEE,
  tx_internal_error: SorobanErrorCode.TX_INTERNAL_ERROR,
  internal_error: SorobanErrorCode.TX_INTERNAL_ERROR,
  tx_soroban_invalid: SorobanErrorCode.TX_SOROBAN_INVALID,
  soroban_invalid: SorobanErrorCode.TX_SOROBAN_INVALID,
  invalid_input: SorobanErrorCode.HOST_INVALID_INPUT,
  host_invalid_input: SorobanErrorCode.HOST_INVALID_INPUT,
  host_auth: SorobanErrorCode.HOST_AUTH,
  host_resource_limit_exceeded: SorobanErrorCode.HOST_RESOURCE_LIMIT_EXCEEDED,
  host_storage_missing_value: SorobanErrorCode.HOST_STORAGE_MISSING_VALUE,
  invoke_host_function_trapped: SorobanErrorCode.INVOKE_HOST_FUNCTION_TRAPPED,
  invoke_host_function_entry_archived:
    SorobanErrorCode.INVOKE_HOST_FUNCTION_ENTRY_ARCHIVED,
  invoke_host_function_resource_limit_exceeded:
    SorobanErrorCode.INVOKE_HOST_FUNCTION_RESOURCE_LIMIT_EXCEEDED,
  restore_footprint_malformed: SorobanErrorCode.RESTORE_FOOTPRINT_MALFORMED,
  extend_footprint_ttl_malformed:
    SorobanErrorCode.EXTEND_FOOTPRINT_TTL_MALFORMED,
};

const JSON_RPC_ERROR_CODE_MAP: Readonly<Record<number, SorobanErrorCode>> = {
  [-32600]: SorobanErrorCode.RPC_INVALID_REQUEST,
  [-32601]: SorobanErrorCode.RPC_METHOD_NOT_FOUND,
  [-32602]: SorobanErrorCode.RPC_INVALID_PARAMS,
  [-32603]: SorobanErrorCode.RPC_INTERNAL_ERROR,
};

/**
 * Node.js/OS-level codes that indicate the request never completed due to a
 * transient network condition; matched against `exception.code`.
 */
const NETWORK_TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT']);

/**
 * Error-message matching pattern (last-resort classification).
 *
 * Soroban host errors surface from the Stellar SDK as free-text messages of
 * the form `HostError(category, reason)` — e.g.
 * `HostError(Auth, Missing value)` — rather than structured result codes.
 * When none of the structured probes in {@link resolveStructuredErrorCode}
 * match, this regex extracts the category and reason from the raw message so
 * the filter can still map the failure to a meaningful `SorobanErrorCode`
 * instead of an opaque HTTP 500.
 *
 * Capture groups:
 * - group 1 — error category (e.g. `Auth`, `Storage`, `Input`)
 * - group 2 — optional reason detail (e.g. `Missing value`, `Limit exceeded`)
 *
 * Both captures are passed through {@link normalizeErrorCode}, then checked
 * in this order inside `resolveHostDiagnosticErrorCode`:
 *   1. category `auth`                        → HOST_AUTH
 *   2. category `storage` + reason
 *      `missing_value`                        → HOST_STORAGE_MISSING_VALUE
 *   3. reason `invalid_input`                 → HOST_INVALID_INPUT
 *   4. reason `limit_exceeded`                → HOST_RESOURCE_LIMIT_EXCEEDED
 *   5. anything else                          → INVOKE_HOST_FUNCTION_TRAPPED
 *
 * Limitations: only the FIRST `HostError(...)` occurrence in a message is
 * considered (`String.exec` semantics), and unrecognized categories/reasons
 * collapse into the generic "contract execution failed" code. Matching is
 * purely diagnostic — it changes which mapped message/status is returned,
 * never the underlying exception behavior.
 */
const HOST_ERROR_PATTERN = /\bHostError\(([^,)]+)(?:,\s*([^)]+))?\)/;

/**
 * Global exception filter that translates unhandled Stellar/Soroban failures
 * into consistent, client-actionable HTTP error responses.
 *
 * Why matching is required: Stellar SDK and Horizon/RPC surfaces report the
 * same underlying failure in several shapes — structured
 * `{ extras: { result_codes } }` payloads, JSON-RPC numeric codes, OS-level
 * network codes, XDR result objects, or free-text `HostError(...)` messages.
 * Without normalization every shape would surface as an anonymous 500.
 *
 * Behavior:
 * - HttpException instances are re-emitted unchanged (standard NestJS wins).
 * - Otherwise the exception is classified via {@link resolveSorobanErrorCode}
 *   (structured probes first, message regex as last resort) and answered with
 *   `ERROR_MAP[code]` status + a friendly `ERROR_MESSAGE_MAP` message under
 *   `error: 'SorobanContractError'`. Raw messages are included in the
 *   `details` field only when NODE_ENV === 'development'.
 * - Unclassifiable errors fall through to a generic 500 response.
 *
 * Note on ordering: this filter is registered after HttpExceptionFilter and
 * ThrottlerExceptionFilter in main.ts; NestJS gives the FIRST matching global
 * filter priority, so HttpExceptions are handled before this filter sees them.
 */
@Catch()
export class SorobanExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SorobanExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Defer to standard NestJS handling for existing HttpExceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return response.status(status).json(exception.getResponse());
    }

    const errMessage = this.getErrorMessage(exception);
    const sorobanErrorCode = this.resolveSorobanErrorCode(exception);

    if (sorobanErrorCode) {
      const statusCode = ERROR_MAP[sorobanErrorCode];
      this.logger.error(
        `Soroban Exception Caught [${sorobanErrorCode}]: ${errMessage}`,
        exception instanceof Error ? exception.stack : '',
      );

      return response.status(statusCode).json({
        success: false,
        statusCode,
        error: 'SorobanContractError',
        message: ERROR_MESSAGE_MAP[sorobanErrorCode],
        details:
          process.env.NODE_ENV === 'development' ? errMessage : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Fallback for generic, non-Soroban unhandled server errors
    this.logger.error(
      `Unhandled Exception: ${errMessage}`,
      exception instanceof Error ? exception.stack : '',
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected internal server error occurred',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Resolves a {@link SorobanErrorCode} for any non-HttpException error.
   *
   * Strategy, in order:
   * 1. Structured probes ({@link resolveStructuredErrorCode}) — deterministic
   *    result codes / numeric codes read from well-known payload fields.
   * 2. Free-text fallback — the {@link HOST_ERROR_PATTERN} regex applied to
   *    the exception message for Soroban host diagnostics.
   * `undefined` means "not a Soroban failure"; the filter then falls back to
   * the generic HTTP 500 response.
   */
  private resolveSorobanErrorCode(
    exception: unknown,
  ): SorobanErrorCode | undefined {
    const structuredCode = this.resolveStructuredErrorCode(exception);
    if (structuredCode) {
      return structuredCode;
    }

    return this.resolveHostDiagnosticErrorCode(this.getErrorMessage(exception));
  }

  /**
   * Attempts every structured source of an error code, in strict precedence
   * order (first non-undefined result wins). Ordering matters because more
   * specific signals must beat generic ones:
   *
   *  1. Horizon `result_codes` — tried on `response.data.extras.result_codes`,
   *     then `extras.result_codes` / `result_codes` / `resultCodes` directly
   *     on the exception. Within a result-codes object the transaction code
   *     is authoritative unless it is `TX_FAILED`, in which case the first
   *     known operation code takes precedence.
   *  2. JSON-RPC error codes (-32600 … -32603) from the response/error body.
   *  3. Network-level codes (ECONNABORTED/ETIMEDOUT) → TIMEOUT.
   *  4. RPC HTTP status — but ONLY when the payload has Stellar-RPC shape
   *     (`hash`, `latestLedger`, `errorResultXdr`, or `errorResult`), so
   *     arbitrary HTTP errors are not misread as Soroban outcomes.
   *     `try_again_later` → TRY_AGAIN_LATER; generic `error`/`failed` →
   *     TX_FAILED.
   *  5. Known string aliases from `response.error.code`,
   *     `responseData.errorCode`, `errorCode`, `resultCode`,
   *     `transactionResultCode`.
   *  6. A parsed XDR `errorResult` object (reads its result switch name).
   *  7. Mere presence of `errorResultXdr` → TX_FAILED (a rejected
   *     transaction whose exact code we could not decode).
   */
  private resolveStructuredErrorCode(
    exception: unknown,
  ): SorobanErrorCode | undefined {
    if (!isRecord(exception)) {
      return this.resolveKnownStringCode(exception);
    }

    const response = getRecord(exception, 'response');
    const responseData = getRecord(response, 'data');
    const responseError = getRecord(responseData, 'error');

    return (
      this.resolveResultCodes(
        getRecord(getRecord(responseData, 'extras'), 'result_codes'),
      ) ??
      this.resolveResultCodes(
        getRecord(getRecord(exception, 'extras'), 'result_codes'),
      ) ??
      this.resolveResultCodes(getRecord(exception, 'result_codes')) ??
      this.resolveResultCodes(getRecord(exception, 'resultCodes')) ??
      this.resolveJsonRpcErrorCode(
        getNumber(responseError, 'code') ??
          getNumber(responseData, 'code') ??
          getNumber(exception, 'code'),
      ) ??
      this.resolveNetworkErrorCode(getString(exception, 'code')) ??
      this.resolveRpcStatusCode(
        getString(responseData, 'status'),
        responseData,
      ) ??
      this.resolveRpcStatusCode(getString(exception, 'status'), exception) ??
      this.resolveKnownStringCode(getString(responseError, 'code')) ??
      this.resolveKnownStringCode(getString(responseData, 'errorCode')) ??
      this.resolveKnownStringCode(getString(exception, 'errorCode')) ??
      this.resolveKnownStringCode(getString(exception, 'resultCode')) ??
      this.resolveKnownStringCode(
        getString(exception, 'transactionResultCode'),
      ) ??
      this.resolveParsedTransactionResult(
        getUnknown(responseData, 'errorResult') ??
          getUnknown(exception, 'errorResult'),
      ) ??
      this.resolveErrorResultXdrPresence(responseData) ??
      this.resolveErrorResultXdrPresence(exception)
    );
  }

  private resolveResultCodes(
    resultCodes: Record<string, unknown> | undefined,
  ): SorobanErrorCode | undefined {
    if (!resultCodes) {
      return undefined;
    }

    const transactionCode =
      this.resolveKnownStringCode(resultCodes.transaction) ??
      this.resolveKnownStringCode(resultCodes.tx);
    const operationCode = this.resolveOperationCode(resultCodes.operations);

    if (transactionCode === SorobanErrorCode.TX_FAILED) {
      return operationCode ?? transactionCode;
    }

    return transactionCode ?? operationCode;
  }

  private resolveOperationCode(
    operations: unknown,
  ): SorobanErrorCode | undefined {
    if (Array.isArray(operations)) {
      for (const operation of operations) {
        const code = this.resolveKnownStringCode(operation);
        if (code) {
          return code;
        }
      }
    }

    return this.resolveKnownStringCode(operations);
  }

  private resolveJsonRpcErrorCode(code: number | undefined) {
    if (typeof code !== 'number') {
      return undefined;
    }

    return JSON_RPC_ERROR_CODE_MAP[code];
  }

  private resolveNetworkErrorCode(code: string | undefined) {
    if (!code) {
      return undefined;
    }

    return NETWORK_TIMEOUT_CODES.has(code)
      ? SorobanErrorCode.TIMEOUT
      : undefined;
  }

  private resolveRpcStatusCode(status: string | undefined, source: unknown) {
    if (!status || !hasStellarRpcResponseShape(source)) {
      return undefined;
    }

    const normalizedStatus = normalizeErrorCode(status);
    if (normalizedStatus === 'try_again_later') {
      return SorobanErrorCode.TRY_AGAIN_LATER;
    }

    if (normalizedStatus === 'error' || normalizedStatus === 'failed') {
      return SorobanErrorCode.TX_FAILED;
    }

    return undefined;
  }

  private resolveKnownStringCode(value: unknown): SorobanErrorCode | undefined {
    return typeof value === 'string'
      ? KNOWN_ERROR_CODE_MAP[normalizeErrorCode(value)]
      : undefined;
  }

  private resolveHostDiagnosticErrorCode(
    message: string,
  ): SorobanErrorCode | undefined {
    const match = HOST_ERROR_PATTERN.exec(message);
    if (!match) {
      return undefined;
    }

    const category = normalizeErrorCode(match[1]);
    const reason = normalizeErrorCode(match[2] ?? '');

    if (category === 'auth') {
      return SorobanErrorCode.HOST_AUTH;
    }

    if (category === 'storage' && reason === 'missing_value') {
      return SorobanErrorCode.HOST_STORAGE_MISSING_VALUE;
    }

    if (reason === 'invalid_input') {
      return SorobanErrorCode.HOST_INVALID_INPUT;
    }

    if (reason === 'limit_exceeded') {
      return SorobanErrorCode.HOST_RESOURCE_LIMIT_EXCEEDED;
    }

    return SorobanErrorCode.INVOKE_HOST_FUNCTION_TRAPPED;
  }

  private resolveParsedTransactionResult(
    errorResult: unknown,
  ): SorobanErrorCode | undefined {
    if (!isRecord(errorResult) || typeof errorResult.result !== 'function') {
      return undefined;
    }

    try {
      const result = errorResult.result.call(errorResult);
      if (!isRecord(result) || typeof result.switch !== 'function') {
        return undefined;
      }

      const transactionCode = result.switch.call(result);
      return this.resolveKnownStringCode(readXdrCodeName(transactionCode));
    } catch {
      return undefined;
    }
  }

  private resolveErrorResultXdrPresence(
    source: unknown,
  ): SorobanErrorCode | undefined {
    return getString(source, 'errorResultXdr')
      ? SorobanErrorCode.TX_FAILED
      : undefined;
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    try {
      return JSON.stringify(exception) ?? String(exception);
    } catch {
      return String(exception);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRecord(
  source: unknown,
  key: string,
): Record<string, unknown> | undefined {
  const value = getUnknown(source, key);
  return isRecord(value) ? value : undefined;
}

function getUnknown(source: unknown, key: string): unknown {
  return isRecord(source) ? source[key] : undefined;
}

function getString(source: unknown, key: string): string | undefined {
  const value = getUnknown(source, key);
  return typeof value === 'string' ? value : undefined;
}

function getNumber(source: unknown, key: string): number | undefined {
  const value = getUnknown(source, key);
  return typeof value === 'number' ? value : undefined;
}

function hasStellarRpcResponseShape(source: unknown): boolean {
  return (
    Boolean(getString(source, 'hash')) ||
    getNumber(source, 'latestLedger') !== undefined ||
    Boolean(getString(source, 'errorResultXdr')) ||
    getUnknown(source, 'errorResult') !== undefined
  );
}

/**
 * Normalizes any error-code spelling to a lowercase snake_case token so the
 * {@link KNOWN_ERROR_CODE_MAP} lookups are tolerant of formatting variants:
 * `TxBadSeq`, `tx-bad-seq`, and `TX_BAD_SEQ` all normalize to `tx_bad_seq`.
 */
function normalizeErrorCode(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function readXdrCodeName(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  if (typeof value.name === 'string') {
    return value.name;
  }

  if (typeof value.name === 'function') {
    return value.name.call(value);
  }

  return undefined;
}
