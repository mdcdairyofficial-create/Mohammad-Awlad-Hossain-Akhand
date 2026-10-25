import { useState, useEffect } from 'react';
import { offlineSyncService } from '../services/offlineSyncService';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(offlineSyncService.getIsOnline());
  const [pendingCount, setPendingCount] = useState<number>(offlineSyncService.getPendingCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((online, count, syncing) => {
      setIsOnline(online);
      setPendingCount(count);
      setIsSyncing(syncing);
    });

    return unsubscribe;
  }, []);

  const syncNow = () => {
    offlineSyncService.processQueue();
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow
  };
}
