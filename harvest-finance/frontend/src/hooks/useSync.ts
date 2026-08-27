import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { syncService } from '@/lib/sync-service';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

export function useSync() {
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    await syncService.syncActions();
    const count = await syncService.getQueuedCount();
    setQueuedCount(count);
    setIsSyncing(false);
  }, [isSyncing]);

  useEffect(() => {
    if (isOnline) {
      void sync();
    }
  }, [isOnline, sync]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const count = await syncService.getQueuedCount();
      setQueuedCount(count);
    }, 5000);

    void syncService.getQueuedCount().then(setQueuedCount);

    return () => clearInterval(interval);
  }, []);

  const queueAction = async (url: string, method: string, body: unknown, headers: Record<string, string> = {}) => {
    const action = await syncService.queueAction(url, method, body, headers);
    setQueuedCount(await syncService.getQueuedCount());
    return action;
  };

  return {
    isOnline,
    isSyncing,
    queuedCount,
    sync,
    queueAction,
  };
}
