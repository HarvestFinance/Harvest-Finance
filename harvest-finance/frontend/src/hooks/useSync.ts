import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/lib/sync-service';

export function useSync() {
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const sync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    await syncService.syncActions();
    const count = await syncService.getQueuedCount();
    setQueuedCount(count);
    setIsSyncing(false);
  }, [isSyncing]);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        void sync();
      }
    };

    setIsOnline(navigator.onLine);
    handleStatusChange();

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const interval = setInterval(async () => {
      const count = await syncService.getQueuedCount();
      setQueuedCount(count);
    }, 5000);

    void syncService.getQueuedCount().then(setQueuedCount);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearInterval(interval);
    };
  }, [sync]);

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
