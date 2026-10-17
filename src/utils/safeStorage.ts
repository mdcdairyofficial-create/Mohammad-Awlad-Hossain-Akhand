/**
 * Safe LocalStorage Utility
 * Prevents DOMException: QuotaExceededError from crashing React components,
 * automatically prunes older ephemeral caches on storage pressure,
 * and maintains an in-memory fallback store for uninterrupted UI operations.
 */

const memoryStore = new Map<string, string>();

export const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn(`[SafeStorage] Error reading key "${key}":`, err);
  }
  return memoryStore.get(key) ?? null;
};

export const safeSetItem = (key: string, value: string): boolean => {
  // Always update memory store for instantaneous fallback access
  memoryStore.set(key, value);

  if (typeof window === 'undefined' || !window.localStorage) {
    return true;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] localStorage quota reached or error writing "${key}":`, err?.message || err);

    // Evict non-essential cache entries to free up space
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('cases_cache_') || k.startsWith('tasks_cache_') || k.startsWith('search_history_') || k === 'appCases' || k === 'appTasks')) {
          if (k !== key) {
            keysToRemove.push(k);
          }
        }
      }

      keysToRemove.forEach((k) => {
        try {
          window.localStorage.removeItem(k);
        } catch {}
      });

      // Retry write after freeing cache space
      window.localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      // Memory store is already populated, so the application continues smoothly without crashing
      return false;
    }
  }
};

export const safeRemoveItem = (key: string): void => {
  memoryStore.delete(key);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[SafeStorage] Error removing key "${key}":`, err);
  }
};

export const safeGetJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Error parsing JSON for key "${key}":`, err);
    return fallback;
  }
};

export const safeSetJson = (key: string, value: any): boolean => {
  try {
    const serialized = JSON.stringify(value);
    return safeSetItem(key, serialized);
  } catch (err) {
    console.warn(`[SafeStorage] Error serializing JSON for key "${key}":`, err);
    return false;
  }
};
