'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentTransaction {
  id: string;
  amount: number;
  vaultName: string;
  createdAt: string;
}

export interface PlatformMetrics {
  timestamp: string;
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeVaults: number;
  totalRewards: number;
  recentDeposits: RecentTransaction[];
  recentWithdrawals: RecentTransaction[];
}

export interface CropYield {
  vaultId: string;
  name: string;
  cropCycle: string;
  balance: number;
  targetAmount: number;
  progressPercent: number;
  projectedYield: number;
}

export interface FarmerMetrics {
  timestamp: string;
  userId: string;
  totalSavings: number;
  totalRewards: number;
  activeFarmVaults: number;
  cropYields: CropYield[];
}

export interface AlertEvent {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseRealtimeAnalyticsOptions {
  /** 'admin' joins the admin room; 'farmer' joins the farmer room */
  mode: 'admin' | 'farmer';
  userId?: string;
  token?: string | null;
}

export function useRealtimeAnalytics({ mode, userId, token }: UseRealtimeAnalyticsOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [farmerMetrics, setFarmerMetrics] = useState<FarmerMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  const dismissAlert = useCallback((index: number) => {
    setAlerts((prev: AlertEvent[]) => prev.filter((_: AlertEvent, i: number) => i !== index));
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${WS_URL}/realtime`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (mode === 'admin') {
        socket.emit('join:admin');
      } else if (userId) {
        socket.emit('join:farmer', { userId });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('metrics:platform', (data: PlatformMetrics) => {
      setPlatformMetrics(data);
    });

    socket.on('metrics:farmer', (data: FarmerMetrics) => {
      setFarmerMetrics(data);
    });

    socket.on('alert:threshold', (data: AlertEvent) => {
      setAlerts((prev: AlertEvent[]) => [data, ...prev].slice(0, 20)); // keep last 20
    });

    return () => {
      socket.disconnect();
    };
  }, [token, mode, userId]);

  return { connected, platformMetrics, farmerMetrics, alerts, dismissAlert };
}
