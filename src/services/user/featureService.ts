import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  doc, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { Notification, Task, SupportMessage, ArchiveCase, Case } from '../../types';
import { deleteDoc, increment } from 'firebase/firestore';
import { recordClientRead, recordClientWrite, recordClientDelete } from '../../utils/firebaseUsageTracker';


// User Profile
export const subscribeToUser = (userId: string, callback: (userData: any) => void) => {
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    recordClientRead(1, 'users');
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn(`[User] Quota exceeded for user subscription (${userId}), using current state.`);
      return;
    }
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  });
};

export const updateProfile = async (userId: string, data: any) => {
  const ref = doc(db, 'users', userId);
  try {
    await setDoc(ref, {
      ...data,
      updated_at: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

// Cache configuration and helpers
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes cache validity

const loadFromCache = <T>(key: string): { data: T; timestamp: number } | null => {
  try {
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object' && 'data' in parsed && 'timestamp' in parsed) {
        return parsed;
      }
      if (parsed !== undefined && parsed !== null) {
        return { data: parsed as T, timestamp: Date.now() };
      }
    }
  } catch (e) {
    console.error("Cache read error for key", key, e);
  }
  return null;
};

const saveToCache = <T>(key: string, data: T) => {
  try {
    const payload = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.error("Cache write error for key", key, e);
  }
};

const clearCache = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Cache remove error for key", key, e);
  }
};

// Cases
export const subscribeToCases = (userId: string, callback: (cases: Case[]) => void, dateFilter?: string) => {
  const cacheKey = `cases_cache_${userId}`;
  const cached = loadFromCache<Case[]>(cacheKey);

  // Serve from cache if fresh
  if (cached && Array.isArray(cached.data) && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    console.log(`[Cache Hit] Serving cases from cache for user: ${userId}`);
    callback(cached.data);
    return () => {}; // Dummy unsubscribe
  }

  let q = query(
    collection(db, 'cases')
  );

  if (dateFilter) {
    q = query(q, where('nextDate', '==', dateFilter));
  }

  return onSnapshot(q, (snapshot) => {
    recordClientRead(snapshot.docs.length || 1, 'cases');
    const cases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as unknown as Case));
    
    // Client-side sort to avoid missing index error
    cases.sort((a: any, b: any) => {
      const dateA = a.created_at ? (typeof a.created_at === 'string' ? new Date(a.created_at).getTime() : (a.created_at as any).toMillis?.() || 0) : 0;
      const dateB = b.created_at ? (typeof b.created_at === 'string' ? new Date(b.created_at).getTime() : (b.created_at as any).toMillis?.() || 0) : 0;
      return dateB - dateA;
    });
    
    saveToCache(cacheKey, cases);
    callback(cases);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Cases] Firestore quota exceeded. Serving from cache or local storage.');
      if (cached && Array.isArray(cached.data)) {
        callback(cached.data);
        return;
      }
      const local = localStorage.getItem(`cases_cache_${userId}`) || localStorage.getItem('appCases');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          const casesList = Array.isArray(parsed) ? parsed : (parsed?.data && Array.isArray(parsed.data) ? parsed.data : []);
          callback(casesList);
          return;
        } catch {}
      }
      callback([]);
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'cases');
  });
};

export const createCase = async (caseData: Omit<Case, 'id' | 'created_at'>) => {
  recordClientWrite(1, 'cases');
  const caseRef = await addDoc(collection(db, 'cases'), {
    ...caseData,
    created_at: serverTimestamp()
  });

  if (caseData.user_id) {
    const userRef = doc(db, 'users', caseData.user_id.toString());
    await setDoc(userRef, {
      points: increment(10)
    }, { merge: true });
    
    clearCache(`cases_cache_${caseData.user_id}`);
  }

  if (auth.currentUser) {
    clearCache(`cases_cache_${auth.currentUser.uid}`);
  }

  return caseRef;
};

export const updateCase = async (caseId: string, caseData: Partial<Case>) => {
  const ref = doc(db, 'cases', caseId);
  try {
    recordClientWrite(1, 'cases');
    await updateDoc(ref, {
      ...caseData,
      updated_at: serverTimestamp()
    });
    
    if (caseData.user_id) {
      clearCache(`cases_cache_${caseData.user_id}`);
    }
    if (auth.currentUser) {
      clearCache(`cases_cache_${auth.currentUser.uid}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `cases/${caseId}`);
  }
};

export const deleteCase = async (caseId: string) => {
  const ref = doc(db, 'cases', caseId);
  try {
    recordClientDelete(1, 'cases');
    await deleteDoc(ref);
    if (auth.currentUser) {
      clearCache(`cases_cache_${auth.currentUser.uid}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cases/${caseId}`);
  }
};


// Notifications
export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const cacheKey = `notifications_cache_${userId}`;
  const cached = loadFromCache<Notification[]>(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    console.log(`[Cache Hit] Serving notifications from cache for user: ${userId}`);
    callback(cached.data);
    return () => {}; // Dummy unsubscribe
  }

  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', userId),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    recordClientRead(snapshot.docs.length || 1, 'notifications');
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isRead: doc.data().read || false
    } as unknown as Notification));
    
    // Client-side sort to avoid missing index error
    notifications.sort((a, b) => {
      const dateA = a.created_at ? (typeof a.created_at === 'string' ? new Date(a.created_at).getTime() : (a.created_at as any).toMillis?.() || 0) : 0;
      const dateB = b.created_at ? (typeof b.created_at === 'string' ? new Date(b.created_at).getTime() : (b.created_at as any).toMillis?.() || 0) : 0;
      return dateB - dateA;
    });
    
    saveToCache(cacheKey, notifications);
    callback(notifications);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Notifications] Firestore quota exceeded. Serving from cache or empty list.');
      if (cached && Array.isArray(cached.data)) {
        callback(cached.data);
        return;
      }
      callback([]);
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'notifications');
  });
};

export const subscribeToGlobalNotifications = (callback: (notifications: Notification[]) => void) => {
  const cacheKey = 'global_notifications_cache';
  const cached = loadFromCache<Notification[]>(cacheKey);

  if (cached && Array.isArray(cached.data) && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    console.log('[Cache Hit] Serving global notifications from cache');
    callback(cached.data);
    return () => {}; // Dummy unsubscribe
  }

  const q = query(
    collection(db, 'global_notifications'),
    orderBy('created_at', 'desc'),
    limit(10)
  );

  return onSnapshot(q, (snapshot) => {
    recordClientRead(snapshot.docs.length || 1, 'notifications');
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isGlobal: true,
      isRead: false // Global notifications are always unread for the user initially
    } as unknown as Notification));
    
    saveToCache(cacheKey, notifications);
    callback(notifications);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Global Notifications] Firestore quota exceeded. Serving from cache or empty list.');
      if (cached && Array.isArray(cached.data)) {
        callback(cached.data);
        return;
      }
      callback([]);
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'global_notifications');
  });
};

export const sendGlobalNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'isRead'>) => {
  try {
    recordClientWrite(1, 'notifications');
    await addDoc(collection(db, 'global_notifications'), {
      ...notification,
      isRead: false,
      created_at: serverTimestamp()
    });
    clearCache('global_notifications_cache');
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'global_notifications');
  }
};

export const sendNotification = async (userId: string, notification: Omit<Notification, 'id' | 'created_at' | 'isRead'>) => {
  try {
    recordClientWrite(1, 'notifications');
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      user_id: userId,
      read: false,
      created_at: new Date().toISOString()
    });
    clearCache(`notifications_cache_${userId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  recordClientWrite(1, 'notifications');
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
  if (auth.currentUser) {
    clearCache(`notifications_cache_${auth.currentUser.uid}`);
  }
};

// Tasks
export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const cacheKey = `tasks_cache_${userId}`;
  const cached = loadFromCache<Task[]>(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    console.log(`[Cache Hit] Serving tasks from cache for user: ${userId}`);
    callback(cached.data);
    return () => {}; // Dummy unsubscribe
  }

  const q = query(
    collection(db, 'tasks'),
    where('assignedTo', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    recordClientRead(snapshot.docs.length || 1, 'tasks');
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as unknown as Task));
    
    // Client-side sort to avoid missing index error
    tasks.sort((a: any, b: any) => {
      const dateA = a.created_at ? (typeof a.created_at === 'string' ? new Date(a.created_at).getTime() : (a.created_at as any).toMillis?.() || 0) : 0;
      const dateB = b.created_at ? (typeof b.created_at === 'string' ? new Date(b.created_at).getTime() : (b.created_at as any).toMillis?.() || 0) : 0;
      return dateB - dateA;
    });
    
    saveToCache(cacheKey, tasks);
    callback(tasks);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Tasks] Firestore quota exceeded. Serving from cache or local storage.');
      if (cached && Array.isArray(cached.data)) {
        callback(cached.data);
        return;
      }
      const local = localStorage.getItem(`tasks_cache_${userId}`) || localStorage.getItem('appTasks');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          const tasksList = Array.isArray(parsed) ? parsed : (parsed?.data && Array.isArray(parsed.data) ? parsed.data : []);
          callback(tasksList);
          return;
        } catch {}
      }
      callback([]);
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'tasks');
  });
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
  recordClientWrite(1, 'tasks');
  const taskRef = await addDoc(collection(db, 'tasks'), {
    ...task,
    created_at: serverTimestamp()
  });

  if (task.assignedTo) {
    clearCache(`tasks_cache_${task.assignedTo}`);
  }
  if (auth.currentUser) {
    clearCache(`tasks_cache_${auth.currentUser.uid}`);
  }

  return taskRef;
};

export const updateTask = async (taskId: string, taskData: Partial<Task>) => {
  const ref = doc(db, 'tasks', taskId);
  try {
    recordClientWrite(1, 'tasks');
    await updateDoc(ref, {
      ...taskData,
      updated_at: serverTimestamp()
    });
    
    if (taskData.assignedTo) {
      clearCache(`tasks_cache_${taskData.assignedTo}`);
    }
    if (auth.currentUser) {
      clearCache(`tasks_cache_${auth.currentUser.uid}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
  }
};

export const deleteTask = async (taskId: string) => {
  const ref = doc(db, 'tasks', taskId);
  try {
    recordClientDelete(1, 'tasks');
    await deleteDoc(ref);
    if (auth.currentUser) {
      clearCache(`tasks_cache_${auth.currentUser.uid}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
};

// Support Chat
export const subscribeToChatSessions = (userId: string, callback: (sessions: any[]) => void) => {
  const q = query(
    collection(db, 'chat_sessions'),
    where('user_id', '==', userId),
    orderBy('updated_at', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sessions);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Chat Sessions] Firestore quota exceeded.');
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'chat_sessions');
  });
};

export const subscribeToAllSupportChats = (callback: (sessions: any[]) => void) => {
  const q = query(
    collection(db, 'chat_sessions'),
    orderBy('updated_at', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sessions);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Support Chats] Firestore quota exceeded.');
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'chat_sessions');
  });
};

export const createChatSession = async (userId: string, title: string) => {
  return await addDoc(collection(db, 'chat_sessions'), {
    user_id: userId,
    title: title,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
};

export const subscribeToMessages = (chatSessionId: string, callback: (messages: SupportMessage[]) => void) => {
  const q = query(
    collection(db, `chat_sessions/${chatSessionId}/messages`),
    orderBy('created_at', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as unknown as SupportMessage));
    callback(messages);
  }, (error: any) => {
    if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
      console.warn('[Messages] Firestore quota exceeded.');
      return;
    }
    handleFirestoreError(error, OperationType.GET, `chat_sessions/${chatSessionId}/messages`);
  });
};

export const sendMessage = async (chatSessionId: string, message: Omit<SupportMessage, 'id' | 'created_at'>) => {
  await addDoc(collection(db, `chat_sessions/${chatSessionId}/messages`), {
    ...message,
    created_at: serverTimestamp()
  });

  await updateDoc(doc(db, 'chat_sessions', chatSessionId), {
    updated_at: serverTimestamp()
  });
};

// Lawyer Directory
export const getLawyers = async () => {
  const cacheKey = 'lawyers_cache';
  const cached = loadFromCache<any[]>(cacheKey);

  // Cache lawyers for 30 minutes since they change rarely
  if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
    console.log('[Cache Hit] Serving lawyers from cache');
    return cached.data;
  }

  const q = query(
    collection(db, 'users'),
    where('user_type', '==', 'lawyer'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];

  saveToCache(cacheKey, data);
  return data;
};

// Clerk Directory
export const getClerks = async () => {
  const cacheKey = 'clerks_cache';
  const cached = loadFromCache<any[]>(cacheKey);

  // Cache clerks for 30 minutes since they change rarely
  if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
    console.log('[Cache Hit] Serving clerks from cache');
    return cached.data;
  }

  const q = query(
    collection(db, 'users'),
    where('user_type', '==', 'clerk'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];

  saveToCache(cacheKey, data);
  return data;
};

// Archive Case History
export const searchArchiveCases = async (caseNumber: string) => {
  const cacheKey = `archive_cases_cache_${caseNumber}`;
  const cached = loadFromCache<ArchiveCase[]>(cacheKey);

  // Archive cases are history and never change, cache for 2 hours
  if (cached && (Date.now() - cached.timestamp < 120 * 60 * 1000)) {
    console.log(`[Cache Hit] Serving archive cases from cache for: ${caseNumber}`);
    return cached.data;
  }

  const q = query(
    collection(db, 'archive_cases'),
    where('caseNumber', '==', caseNumber),
    limit(10)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as unknown as ArchiveCase[];

  saveToCache(cacheKey, data);
  return data;
};
