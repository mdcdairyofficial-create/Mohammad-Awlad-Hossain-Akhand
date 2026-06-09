import { auth } from '../firebase';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let retries = 3;
  let backoff = 1000;
  
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
      backoff *= 2;
    }
  }
  throw new Error("Fetch failed after maximum retries");
}

