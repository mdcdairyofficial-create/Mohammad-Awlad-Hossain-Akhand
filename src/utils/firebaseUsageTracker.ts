import { fetchWithAuth } from '../lib/api';

export interface ClientDailyUsage {
  date: string;
  reads: number;
  writes: number;
  deletes: number;
  pendingSync: {
    reads: number;
    writes: number;
    deletes: number;
  };
}

function getTodayKey(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `firebase_usage_${year}-${month}-${day}`;
}

export function getClientDailyUsage(): ClientDailyUsage {
  const key = getTodayKey();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.reads === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  const initial: ClientDailyUsage = {
    date: key.replace('firebase_usage_', ''),
    reads: 0,
    writes: 0,
    deletes: 0,
    pendingSync: {
      reads: 0,
      writes: 0,
      deletes: 0,
    },
  };
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {}
  return initial;
}

let syncTimeout: any = null;

function saveClientDailyUsage(usage: ClientDailyUsage) {
  const key = getTodayKey();
  try {
    localStorage.setItem(key, JSON.stringify(usage));
  } catch {}

  // Trigger debounced server sync if there are pending items
  if (
    usage.pendingSync.reads > 0 ||
    usage.pendingSync.writes > 0 ||
    usage.pendingSync.deletes > 0
  ) {
    if (!syncTimeout) {
      syncTimeout = setTimeout(() => {
        syncTimeout = null;
        flushPendingSync();
      }, 5000);
    }
  }
}

export async function flushPendingSync() {
  const usage = getClientDailyUsage();
  if (
    usage.pendingSync.reads === 0 &&
    usage.pendingSync.writes === 0 &&
    usage.pendingSync.deletes === 0
  ) {
    return;
  }

  const toSend = { ...usage.pendingSync };
  // Reset pending sync locally
  usage.pendingSync = { reads: 0, writes: 0, deletes: 0 };
  saveClientDailyUsage(usage);

  try {
    await fetchWithAuth('/api/system/firebase-usage/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend),
    });
  } catch (err) {
    // Put back to pending if failed
    const current = getClientDailyUsage();
    current.pendingSync.reads += toSend.reads;
    current.pendingSync.writes += toSend.writes;
    current.pendingSync.deletes += toSend.deletes;
    try {
      localStorage.setItem(getTodayKey(), JSON.stringify(current));
    } catch {}
  }
}

export function recordClientRead(count = 1, category = 'cases') {
  if (count <= 0) return;
  const usage = getClientDailyUsage();
  usage.reads += count;
  usage.pendingSync.reads += count;
  saveClientDailyUsage(usage);
}

export function recordClientWrite(count = 1, category = 'cases') {
  if (count <= 0) return;
  const usage = getClientDailyUsage();
  usage.writes += count;
  usage.pendingSync.writes += count;
  saveClientDailyUsage(usage);
}

export function recordClientDelete(count = 1, category = 'cases') {
  if (count <= 0) return;
  const usage = getClientDailyUsage();
  usage.deletes += count;
  usage.pendingSync.deletes += count;
  saveClientDailyUsage(usage);
}
