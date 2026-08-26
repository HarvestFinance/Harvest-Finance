'use client';

import { useEffect, ReactNode } from 'react';

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      // Send actionable, structured telemetry
      console.error('[Telemetry] Unhandled Exception:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error,
        timestamp: new Date().toISOString(),
      });
      // Do not break the UI - preventDefault stops the default browser error handling,
      // but might suppress it from console. We just log it.
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[Telemetry] Unhandled Promise Rejection:', {
        reason: event.reason?.stack || event.reason,
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}
