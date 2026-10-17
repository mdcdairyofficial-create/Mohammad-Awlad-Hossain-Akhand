import { auth } from '../firebase';
import { safeGetItem } from '../utils/safeStorage';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let isAuthInitialized = false;

// Fast auth readiness check that does not freeze or block offline requests
async function ensureAuthReady() {
  if (isAuthInitialized) return;
  try {
    if (auth && typeof auth.authStateReady === 'function') {
      await Promise.race([
        auth.authStateReady(),
        new Promise(resolve => setTimeout(resolve, 800)) // 800ms upper bound
      ]);
      isAuthInitialized = true;
    }
  } catch (err) {
    console.warn("Auth readiness notice:", err);
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let retries = 3;
  let backoff = 800;
  
  await ensureAuthReady();

  for (let i = 0; i < retries; i++) {
    try {
      const user = auth.currentUser;
      const headers = { ...(options.headers || {}) } as Record<string, string>;
      
      if (user) {
        try {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          console.warn("Could not retrieve auth token:", e);
        }
      } else {
        // Fallback: If Firebase user is not signed in, check if we have a saved developer/bypass user in safe storage
        try {
          const savedUserStr = safeGetItem("appUser");
          if (savedUserStr) {
            const appUser = JSON.parse(savedUserStr);
            const uid = appUser.firebaseUid || appUser.id || "1";
            headers['Authorization'] = `Bearer mock_user_${uid}`;
          }
        } catch (storageErr) {
          console.warn("Could not retrieve mock user context from safeStorage:", storageErr);
        }
      }
      
      const res = await fetch(url, {
        ...options,
        headers
      });
      
      // Retry for server warming up statuses (502 Gateway, 503 Service Unavailable, 504 Gateway Timeout)
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(`Transient server status ${res.status}`);
      }
      
      return res;
    } catch (err: any) {
      if (i === retries - 1) {
        throw err;
      }
      console.warn(`Failed to fetch ${url} (attempt ${i + 1}/${retries}). Retrying in ${backoff}ms...`, err);
      await delay(backoff);
      backoff *= 1.5;
    }
  }
  throw new Error("Fetch failed after maximum retries");
}

