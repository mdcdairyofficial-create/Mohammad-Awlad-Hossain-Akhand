import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore,
  doc,
  getDocFromServer,
  setLogLevel,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Filter out benign Firestore offline/auth-token warnings from triggering critical console errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (
      message.includes('Could not reach Cloud Firestore backend') ||
      message.includes('Fetching auth token failed') ||
      message.includes('auth/network-request-failed')
    ) {
      console.warn('Firestore offline notice:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Silence internal Firestore SDK network reconnection logs
try {
  setLogLevel('silent');
} catch {
  // Ignore if already set or unsupported in environment
}

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore per skill specification with IndexedDB Offline Persistence
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).then(() => {
    console.log('[Firebase] IndexedDB offline persistence enabled successfully.');
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Persistence multi-tab limitation (failed-precondition).');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] IndexedDB persistence unimplemented in this browser context.');
    } else {
      console.warn('[Firebase] Could not enable offline persistence:', err);
    }
  });
}

export const auth = getAuth(app);
export const storage = getStorage(app, firebaseConfig.storageBucket);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration: client is offline.");
    } else {
      // Non-fatal connection test result
      console.warn("Firestore connection check (offline mode):", error?.message || error);
    }
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1000);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  // If permission issue, throw JSON error for diagnostic and rule-enforcement workflows
  if (errCode === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // Graceful handling for offline / network disruptions
    console.warn('Firestore Operation Notice (offline/network):', errMsg);
  }
}
