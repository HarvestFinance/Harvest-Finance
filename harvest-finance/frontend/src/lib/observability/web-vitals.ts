import { onCLS, onINP, onLCP } from 'web-vitals';

type MetricReport = {
  name: 'LCP' | 'CLS' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: string;
};

const send = (metric: MetricReport) => {
  if (typeof window === 'undefined') return;
  const url = `${window.location.origin}/api/v1/observability/web-vitals`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, JSON.stringify(metric));
  } else {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
};

export function initWebVitals() {
  if (typeof window === 'undefined') return;

  onCLS((m) => send({ ...m, timestamp: new Date().toISOString() }));
  onINP((m) => send({ ...m, timestamp: new Date().toISOString() }));
  onLCP((m) => send({ ...m, timestamp: new Date().toISOString() }));
}
