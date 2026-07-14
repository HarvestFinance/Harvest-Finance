export type OfflineActionType = "deposit" | "withdraw" | "ai-query";

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardSnapshot {
  updatedAt: string;
  vaultBalance: number;
  totalDeposits: number;
  totalRewards: number;
  queuedActions: number;
  activeVaults: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

const QUEUE_KEY = "harvest-offline-queue-v1";
const SNAPSHOT_KEY = "harvest-dashboard-snapshot-v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadOfflineQueue(): OfflineAction[] {
  return readJson<OfflineAction[]>(QUEUE_KEY, []);
}

export function saveOfflineQueue(actions: OfflineAction[]) {
  writeJson(QUEUE_KEY, actions);
}

export function enqueueOfflineAction(
  action: Omit<OfflineAction, "id" | "createdAt">,
): OfflineAction {
  const queuedAction: OfflineAction = {
    ...action,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  saveOfflineQueue([...loadOfflineQueue(), queuedAction]);
  return queuedAction;
}

export function removeOfflineAction(actionId: string) {
  saveOfflineQueue(
    loadOfflineQueue().filter((action) => action.id !== actionId),
  );
}

export function loadDashboardSnapshot(): DashboardSnapshot | null {
  return readJson<DashboardSnapshot | null>(SNAPSHOT_KEY, null);
}

export function saveDashboardSnapshot(snapshot: DashboardSnapshot) {
  writeJson(SNAPSHOT_KEY, snapshot);
}
