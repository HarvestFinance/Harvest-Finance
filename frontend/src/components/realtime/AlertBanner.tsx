'use client';

import React from 'react';
import { AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { AlertEvent } from '@/hooks/useRealtimeAnalytics';

interface AlertBannerProps {
  alerts: AlertEvent[];
  onDismiss: (index: number) => void;
}

const SEVERITY_STYLES: Record<string, string> = {
  info:     'bg-blue-50 border-blue-200 text-blue-800',
  warning:  'bg-amber-50 border-amber-200 text-amber-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  info:     <Info className="w-4 h-4 flex-shrink-0" />,
  warning:  <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  critical: <XCircle className="w-4 h-4 flex-shrink-0" />,
};

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info}`}
        >
          {SEVERITY_ICON[alert.severity] ?? SEVERITY_ICON.info}
          <span className="flex-1">{alert.message}</span>
          <button
            onClick={() => onDismiss(i)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
