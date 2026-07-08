'use client';

import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '@/types/notification';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    userId: 'user-1',
    adminOnly: false,
    title: 'New Vault Available!',
    message: 'The High-Yield Corn Vault is now live with 24.5% APY.',
    type: NotificationType.VAULT_CREATED,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user-1',
    adminOnly: false,
    title: 'Deposit Successful',
    message: 'Your deposit of 500 USDC into the Wheat Vault has been confirmed.',
    type: NotificationType.DEPOSIT,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: 'user-1',
    adminOnly: false,
    title: 'Weekly Rewards Distributed',
    message: 'You have received 45.2 HF tokens from the staking pool.',
    type: NotificationType.REWARD,
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    userId: 'user-1',
    adminOnly: false,
    title: 'System Maintenance',
    message: 'Harvest Finance will undergo scheduled maintenance on Sunday at 02:00 UTC.',
    type: NotificationType.SYSTEM,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    userId: 'user-1',
    adminOnly: false,
    title: 'Large Whale Move',
    message: 'A transfer of 1,000,000 USDC was detected in the Liquidity Pool.',
    type: NotificationType.LARGE_TRANSACTION,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    updatedAt: new Date().toISOString(),
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(notifications.filter(n => !n.isRead).length);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: () => {},
  };
}
