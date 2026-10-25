import { Case } from '../types';
import { createCase, updateCase, deleteCase } from './user/featureService';

export interface PendingOfflineChange {
  id: string; // Unique queue ID
  type: 'create' | 'update' | 'delete';
  caseId?: string | number;
  caseData: Partial<Case>;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = 'mdc_pending_case_queue';
const OFFLINE_CASES_CACHE_KEY = 'mdc_offline_cases_cache';

class OfflineSyncService {
  private listeners: Set<(isOnline: boolean, pendingCount: number, isSyncing: boolean) => void> = new Set();
  private isSyncing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Attempt initial sync on load if online and queue is non-empty
      setTimeout(() => {
        if (navigator.onLine) {
          this.processQueue();
        }
      }, 2000);
    }
  }

  public subscribe(callback: (isOnline: boolean, pendingCount: number, isSyncing: boolean) => void) {
    this.listeners.add(callback);
    callback(this.isOnline, this.getPendingCount(), this.isSyncing);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const count = this.getPendingCount();
    this.listeners.forEach(cb => cb(this.isOnline, count, this.isSyncing));
  }

  private handleOnline = () => {
    console.log('[OfflineSync] Browser is back ONLINE. Initiating sync process...');
    this.isOnline = true;
    this.notifyListeners();
    this.processQueue();
  };

  private handleOffline = () => {
    console.warn('[OfflineSync] Browser went OFFLINE. Offline caching mode active.');
    this.isOnline = false;
    this.notifyListeners();
  };

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public getPendingCount(): number {
    const queue = this.getQueue();
    return queue.length;
  }

  public getQueue(): PendingOfflineChange[] {
    try {
      const val = localStorage.getItem(QUEUE_STORAGE_KEY);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      console.error('[OfflineSync] Failed to read pending queue:', e);
      return [];
    }
  }

  private setQueue(queue: PendingOfflineChange[]) {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error('[OfflineSync] Failed to save pending queue:', e);
    }
  }

  // Get locally cached cases merged with pending offline creations/updates
  public getLocalOfflineCases(userId?: string): Case[] {
    try {
      const rawCache = localStorage.getItem(OFFLINE_CASES_CACHE_KEY);
      let cases: Case[] = rawCache ? JSON.parse(rawCache) : [];
      
      // Also fallback to generic appCases
      if (!cases.length && typeof window !== 'undefined') {
        const altCache = localStorage.getItem('appCases') || localStorage.getItem(`cases_cache_${userId}`);
        if (altCache) {
          try {
            const parsed = JSON.parse(altCache);
            cases = Array.isArray(parsed) ? parsed : (parsed?.data || []);
          } catch {}
        }
      }

      // Merge pending local changes
      const queue = this.getQueue();
      const caseMap = new Map<string | number, Case>();

      cases.forEach(c => caseMap.set(String(c.id), c));

      queue.forEach(qItem => {
        if (qItem.type === 'create') {
          const tempId = qItem.caseData.id || `local_${qItem.timestamp}`;
          caseMap.set(String(tempId), {
            ...qItem.caseData,
            id: tempId,
            isOfflinePending: true
          } as Case);
        } else if (qItem.type === 'update' && qItem.caseId) {
          const existing = caseMap.get(String(qItem.caseId));
          if (existing) {
            caseMap.set(String(qItem.caseId), {
              ...existing,
              ...qItem.caseData,
              isOfflinePending: true
            } as Case);
          }
        } else if (qItem.type === 'delete' && qItem.caseId) {
          caseMap.delete(String(qItem.caseId));
        }
      });

      return Array.from(caseMap.values());
    } catch (e) {
      console.error('[OfflineSync] Failed to fetch local offline cases:', e);
      return [];
    }
  }

  // Save current cases list to local offline storage cache
  public saveLocalOfflineCases(cases: Case[]) {
    try {
      localStorage.setItem(OFFLINE_CASES_CACHE_KEY, JSON.stringify(cases));
    } catch (e) {
      console.error('[OfflineSync] Failed to save local offline cases cache:', e);
    }
  }

  // Queue an offline case change (or local optimistic save)
  public async queueCaseChange(
    type: 'create' | 'update' | 'delete',
    caseData: Partial<Case>,
    caseId?: string | number
  ): Promise<{ success: boolean; isQueuedOffline: boolean; resultId?: string }> {
    const queue = this.getQueue();
    const newEntry: PendingOfflineChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      caseId,
      caseData: {
        ...caseData,
        isUpdated: true,
        lastEditedDate: new Date().toISOString()
      },
      timestamp: Date.now()
    };

    queue.push(newEntry);
    this.setQueue(queue);

    // Update local cache immediately so UI shows the update offline instantly
    const existingOfflineCases = this.getLocalOfflineCases();
    let updatedCases = [...existingOfflineCases];

    if (type === 'create') {
      const generatedId = caseData.id || `offline_${Date.now()}`;
      const newCase: Case = {
        ...caseData,
        id: generatedId,
        caseNumber: caseData.caseNumber || 'মামলা নং অনুপস্থিত',
        courtName: caseData.courtName || caseData.court || '',
        nextDate: caseData.nextDate || new Date().toISOString().split('T')[0],
        status: caseData.status || 'Pending',
        caseType: caseData.caseType || '',
        petitioner: caseData.petitioner || '',
        respondent: caseData.respondent || '',
        isUpdated: true,
        isOfflinePending: true
      } as Case;
      updatedCases.unshift(newCase);
    } else if (type === 'update' && caseId) {
      updatedCases = updatedCases.map(c => 
        String(c.id) === String(caseId) ? { ...c, ...caseData, isOfflinePending: true } : c
      );
    } else if (type === 'delete' && caseId) {
      updatedCases = updatedCases.filter(c => String(c.id) !== String(caseId));
    }

    this.saveLocalOfflineCases(updatedCases);

    // If online, immediately attempt to process the queue to sync with server
    if (this.isOnline) {
      this.processQueue();
      return { success: true, isQueuedOffline: false, resultId: String(caseId || newEntry.id) };
    }

    return { success: true, isQueuedOffline: true, resultId: String(caseId || newEntry.id) };
  }

  // Process and flush all queued offline changes to Firestore
  public async processQueue() {
    if (this.isSyncing || !this.isOnline) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners();

    console.log(`[OfflineSync] Processing ${queue.length} offline changes...`);

    const remainingQueue: PendingOfflineChange[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'create') {
          // Exclude client-generated offline ID before sending to Firestore
          const { id, isOfflinePending, ...dataToSave } = item.caseData as any;
          await createCase(dataToSave);
          console.log(`[OfflineSync] Successfully synced created case: ${dataToSave.caseNumber}`);
        } else if (item.type === 'update' && item.caseId) {
          const { id, isOfflinePending, ...dataToSave } = item.caseData as any;
          await updateCase(String(item.caseId), dataToSave);
          console.log(`[OfflineSync] Successfully synced updated case ID: ${item.caseId}`);
        } else if (item.type === 'delete' && item.caseId) {
          await deleteCase(String(item.caseId));
          console.log(`[OfflineSync] Successfully synced deleted case ID: ${item.caseId}`);
        }
      } catch (err: any) {
        console.error(`[OfflineSync] Failed to sync item ${item.id}:`, err);
        // Keep in queue for next retry if it failed due to network disruption
        if (!err?.message?.includes('permission-denied')) {
          remainingQueue.push(item);
        }
      }
    }

    this.setQueue(remainingQueue);
    this.isSyncing = false;
    this.notifyListeners();

    if (remainingQueue.length === 0) {
      console.log('[OfflineSync] All offline changes successfully synced to Firestore!');
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
