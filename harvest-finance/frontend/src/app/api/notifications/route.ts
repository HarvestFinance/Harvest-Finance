import { NextRequest, NextResponse } from 'next/server';
import { NotificationType } from '@/types/notification';
import type { Notification } from '@/types/notification';

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    adminOnly: false,
    title: 'Vault Milestone Achieved',
    message: 'Your Early Season Maize vault has reached the Seed Funding milestone (25%).',
    type: NotificationType.VAULT_MILESTONE,
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    adminOnly: false,
    title: 'Reward Distributed',
    message: 'You received 0.045 ETH in staking rewards from the ETH Staking Vault.',
    type: NotificationType.REWARD,
    isRead: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    adminOnly: false,
    title: 'Deposit Confirmed',
    message: 'Your deposit of $250.00 USDC to the USDC Stable Yield vault has been confirmed.',
    type: NotificationType.DEPOSIT,
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    adminOnly: false,
    title: 'System Alert',
    message: 'Scheduled maintenance on Stellar network. Transactions may experience delays.',
    type: NotificationType.SYSTEM,
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-5',
    userId: null,
    adminOnly: true,
    title: 'New Strategy Deployed',
    message: 'A new yield strategy has been deployed to the Harvest Liquidity vault.',
    type: NotificationType.SYSTEM,
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get('admin') === 'true';
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let result = mockNotifications;

  if (unreadOnly) {
    result = result.filter((n) => !n.isRead);
  }

  if (!admin) {
    result = result.filter((n) => !n.adminOnly);
  }

  result = result
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId: body.userId || null,
      adminOnly: body.adminOnly ?? false,
      title: body.title,
      message: body.message,
      type: body.type as NotificationType,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockNotifications.push(newNotification);
    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const notification = mockNotifications.find((n) => n.id === id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    Object.assign(notification, await request.json());
    notification.updatedAt = new Date().toISOString();
    return NextResponse.json(notification);
  }

  const body = await request.json();
  if (body.allUnread) {
    mockNotifications
      .filter((n) => !n.isRead && !n.adminOnly)
      .forEach((n) => {
        n.isRead = true;
        n.updatedAt = new Date().toISOString();
      });
    return NextResponse.json({ message: 'All notifications marked as read' });
  }

  return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const index = mockNotifications.findIndex((n) => n.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  mockNotifications.splice(index, 1);
  return NextResponse.json({ success: true });
}
