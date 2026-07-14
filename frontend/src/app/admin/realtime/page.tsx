'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRealtimeAnalytics, type PlatformMetrics } from '@/hooks/useRealtimeAnalytics';
import { LivePlatformMetrics } from '@/components/realtime/LivePlatformMetrics';
import { AlertBanner } from '@/components/realtime/AlertBanner';
import { Container, Stack } from '@/components/ui';
import { Activity, ShieldCheck } from 'lucide-react';

const MAX_HISTORY = 30; // keep last 30 snapshots for sparkline

export default function AdminRealtimePage() {
  const { user, token } = useAuthStore();
  const router = useRouter();

  const { connected, platformMetrics, alerts, dismissAlert } = useRealtimeAnalytics({
    mode: 'admin',
    token,
  });

  // Rolling history for trend sparkline
  const [history, setHistory] = useState<PlatformMetrics[]>([]);
  const prevMetrics = useRef<PlatformMetrics | null>(null);

  useEffect(() => {
    if (!user || user.role?.toString().toLowerCase() !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (platformMetrics && platformMetrics !== prevMetrics.current) {
      prevMetrics.current = platformMetrics;
      setHistory((prev: PlatformMetrics[]) => [...prev, platformMetrics].slice(-MAX_HISTORY));
    }
  }, [platformMetrics]);

  return (
    <Container size="xl" className="py-8">
      <Stack gap="xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-harvest-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Real-Time Analytics
              <Activity className="w-5 h-5 text-harvest-green-500 animate-pulse" />
            </h1>
            <p className="text-sm text-gray-500">Live platform performance — updates every 30 seconds</p>
          </div>
        </div>

        {/* Alerts */}
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

        {/* Live metrics */}
        <LivePlatformMetrics
          metrics={platformMetrics}
          connected={connected}
          history={history}
        />
      </Stack>
    </Container>
  );
}
