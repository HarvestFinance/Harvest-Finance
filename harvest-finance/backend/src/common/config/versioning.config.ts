/**
 * API Versioning Configuration
 *
 * Manages API versions and deprecation schedules.
 * Ensures frontend stability during backend updates.
 *
 *   Before editing this file, read the versioning guide:
 *    docs/api/versioning.md
 *
 * ## Versioning strategies
 *
 * ### URI versioning (enabled)
 *
 * The version lives in the URL path: `/api/v{N}/{resource}`
 * (e.g. `/api/v1/vaults`). Enabled in `main.ts` via
 * `app.enableVersioning({ type: VersioningType.URI })`, which makes NestJS
 * match the `version` key declared on each `@Controller()` against the
 * `/api/v{N}` segment of the request URL. Controllers without a `version`
 * are reachable under any version number (`VERSION_NEUTRAL`).
 *
 * Clients select a version purely through the URL they call — there is
 * nothing else to configure.
 *
 * ### Header versioning (not enabled)
 *
 * Version selection through an `Accept:` vendor header or a custom
 * `X-API-Version` request header is deliberately NOT supported. If such a
 * header is sent it is ignored for routing purposes. See §3 of
 * `docs/api/versioning.md` for the reasoning (cacheability, visibility,
 * simplicity).
 *
 * ### Precedence
 *
 * Because only URI versioning is enabled there is no precedence conflict:
 * the URL path always decides which version serves the request. Response
 * headers such as `X-API-Version`, `Deprecation`, `Sunset` and `Warning` are
 * added by the `VersioningInterceptor`; they describe the version that was
 * selected from the URL and never influence routing.
 */

/**
 * Versions known to the application.
 */
export enum ApiVersionEnum {
  V1 = '1',
  V2 = '2',
}

export interface ApiVersionConfig {
  /** Version recommended for new integrations. */
  current: ApiVersionEnum;
  /** Versions that still resolve to routes; anything else gets a 404. */
  supported: ApiVersionEnum[];
  /**
   * Deprecated versions mapped to their sunset (removal) date.
   * `null` marks a version as deprecated with no sunset date agreed yet —
   * the interceptor then omits the `Sunset` header and reports `TBD` in the
   * `Warning` header. Add an entry here (with a date at least 6 months out,
   * per docs/api/versioning.md §8) when a version is superseded.
   */
  deprecated: Map<ApiVersionEnum, Date | null>;
  /** URL prefix emitted before the version segment. */
  versionPrefix: string;
}

export const VERSIONING_CONFIG: ApiVersionConfig = {
  current: ApiVersionEnum.V1,
  supported: [ApiVersionEnum.V1],
  deprecated: new Map([
    // Example: [ApiVersionEnum.V0, new Date('2025-12-31')],
    // Null means no deprecation date set
  ]),
  versionPrefix: 'api',
};

/**
 * Get deprecation status for a version
 * @param version The API version to check
 * @returns Object with deprecation status
 */
export function getVersionDeprecationInfo(version: ApiVersionEnum) {
  const deprecationDate = VERSIONING_CONFIG.deprecated.get(version);

  return {
    isDeprecated: VERSIONING_CONFIG.deprecated.has(version),
    deprecationDate: deprecationDate || null,
    isSupported: VERSIONING_CONFIG.supported.includes(version),
    isCurrent: version === VERSIONING_CONFIG.current,
  };
}

/**
 * Get supported versions as array
 */
export function getSupportedVersions(): string[] {
  return VERSIONING_CONFIG.supported.map((v) => v.toString());
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: string): boolean {
  return VERSIONING_CONFIG.supported.includes(version as ApiVersionEnum);
}

/**
 * Get the API versioning strategy URI format
 * Returns format like: /api/v1/resource, /api/v2/resource
 */
export function getVersionedRoute(
  version: ApiVersionEnum | string,
  route: string,
): string {
  const v = String(version);
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${VERSIONING_CONFIG.versionPrefix}/v${v}${cleanRoute}`;
}
