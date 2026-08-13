declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAOptions {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: Array<{
      urlPattern?: (args: { request: Request; url: URL }) => boolean;
      handler: string;
      options?: Record<string, unknown>;
    }>;
    fallbacks?: Record<string, string>;
  }

  const withPWA: (options: PWAOptions) => (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
