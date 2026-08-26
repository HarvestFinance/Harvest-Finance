import { HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { VersioningInterceptor } from './versioning.interceptor';
import { ApiVersionEnum, VERSIONING_CONFIG } from '../config/versioning.config';
import { CustomLoggerService } from '../../logger/custom-logger.service';

describe('VersioningInterceptor', () => {
  let interceptor: VersioningInterceptor;
  let headers: Record<string, string>;

  const createContext = (requestPath: string) => {
    const request = { path: requestPath };
    const response = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as any;
  };

  const run = async (requestPath: string) => {
    const context = createContext(requestPath);
    const next = { handle: () => of('response-body') };
    return await firstValueFrom(interceptor.intercept(context, next as any));
  };

  beforeEach(() => {
    headers = {};
    const logger = {
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as CustomLoggerService;
    interceptor = new VersioningInterceptor(logger);
  });

  afterEach(() => {
    VERSIONING_CONFIG.deprecated.delete(ApiVersionEnum.V1);
  });

  it('marks the response with the requested version for a current version', async () => {
    await run('/api/v1/vaults');

    expect(headers['X-API-Version']).toBe('v1');
    expect(headers['Deprecation']).toBeUndefined();
    expect(headers['Sunset']).toBeUndefined();
    expect(headers['Warning']).toBeUndefined();
  });

  it('does not add deprecation headers when a newer deprecated version exists', async () => {
    VERSIONING_CONFIG.deprecated.set(ApiVersionEnum.V2, new Date('2030-01-01'));

    await run('/api/v1/auth/login');

    expect(headers['Deprecation']).toBeUndefined();
    expect(headers['Sunset']).toBeUndefined();
    expect(headers['Warning']).toBeUndefined();
  });

  it('emits Deprecation and Sunset headers for a deprecated version with a configured sunset date', async () => {
    const sunset = new Date('2030-06-30T00:00:00.000Z');
    VERSIONING_CONFIG.deprecated.set(ApiVersionEnum.V1, sunset);

    await run('/api/v1/vaults');

    expect(headers['X-API-Version']).toBe('v1');
    expect(headers['Deprecation']).toBe('true');
    expect(headers['Sunset']).toBe(sunset.toUTCString());
    expect(headers['Warning']).toContain('299');
    expect(headers['Warning']).toContain('deprecated');
  });

  it('omits the Sunset header for a deprecated version without a configured sunset date', async () => {
    VERSIONING_CONFIG.deprecated.set(ApiVersionEnum.V1, null);

    await run('/api/v1/vaults');

    expect(headers['Deprecation']).toBe('true');
    expect(headers['Sunset']).toBeUndefined();
    expect(headers['Warning']).toContain('TBD');
  });

  it('adds no version headers for unversioned paths', async () => {
    await run('/health');

    expect(headers['X-API-Version']).toBeUndefined();
    expect(headers['Deprecation']).toBeUndefined();
  });

  it('rejects unsupported versions with a 404 listing supported versions', async () => {
    const context = createContext('/api/v99/vaults');
    const next = { handle: () => of('never') };

    let caught: unknown;
    try {
      interceptor.intercept(context, next as any);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpException);
    const httpException = caught as HttpException;
    expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(httpException.message).toContain('v99');
    expect((httpException.getResponse() as any).supportedVersions).toEqual(
      getSupportedVersionsValue(),
    );
  });
});

function getSupportedVersionsValue(): string[] {
  return VERSIONING_CONFIG.supported.map((v) => v.toString());
}
