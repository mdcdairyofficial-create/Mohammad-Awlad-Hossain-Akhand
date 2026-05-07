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
import { deleteDoc } from 'firebase/firestore';


// User Profile
export const subscribeToUser = (userId: string, callback: (userData: any) => void) => {
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  });
};

export const updateProfile = async (userId: string, data: any) => {
  const ref = doc(db, 'users', userId);
  try {
    await updateDoc(ref, {
      ...data,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

// Cases
export const subscribeToCases = (userId: string, callback: (cases: Case[]) => void) => {
  const q = query(
    collection(db, 'cases'),
    where('user_id', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
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
    
    callback(cases);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'cases');
  });
};

export const createCase = async (caseData: Omit<Case, 'id' | 'created_at'>) => {
  return await addDoc(collection(db, 'cases'), {
    ...caseData,
    created_at: serverTimestamp()
  });
};

export const updateCase = async (caseId: string, caseData: Partial<Case>) => {
  const ref = doc(db, 'cases', caseId);
  try {
    await updateDoc(ref, {
      ...caseData,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `cases/${caseId}`);
  }
};

export const deleteCase = async (caseId: string) => {
  const ref = doc(db, 'cases', caseId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cases/${caseId}`);
  }
};


// Notifications
export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', userId),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
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
    
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'notifications');
  });
};

export const subscribeToGlobalNotifications = (callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'global_notifications'),
    orderBy('created_at', 'desc'),
    limit(10)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isGlobal: true,
      isRead: false // Global notifications are always unread for the user initially
    } as unknown as Notification));
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'global_notifications');
  });
};

export const sendGlobalNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'isRead'>) => {
  try {
    await addDoc(collection(db, 'global_notifications'), {
      ...notification,
      isRead: false,
      created_at: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'global_notifications');
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
};

// Tasks
export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const q = query(
    collection(db, 'tasks'),
    where('assignedTo', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
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
    
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'tasks');
  });
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
  return await addDoc(collection(db, 'tasks'), {
    ...task,
    created_at: serverTimestamp()
  });
};

export const updateTask = async (taskId: string, taskData: Partial<Task>) => {
  const ref = doc(db, 'tasks', taskId);
  try {
    await updateDoc(ref, {
      ...taskData,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
  }
};

export const deleteTask = async (taskId: string) => {
  const ref = doc(db, 'tasks', taskId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
};

// Support Chat
export const subscribeToMessages = (chatId: string, callback: (messages: SupportMessage[]) => void) => {
  const q = query(
    collection(db, `support_chats/${chatId}/messages`),
    orderBy('created_at', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as unknown as SupportMessage));
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `support_chats/${chatId}/messages`);
  });
};

export const sendMessage = async (chatId: string, message: Omit<SupportMessage, 'id' | 'created_at'>) => {
  const messageRef = await addDoc(collection(db, `support_chats/${chatId}/messages`), {
    ...message,
    created_at: serverTimestamp()
  });

  // Update the chat document with last message info
  const chatRef = doc(db, 'support_chats', chatId);
  try {
    await updateDoc(chatRef, {
      last_message: message.message,
      last_message_at: serverTimestamp(),
      user_name: message.sender_name, // Ensure user name is updated
      user_id: chatId // Assuming chatId is userId for now
    });
  } catch (err) {
    // If document doesn't exist, create it
    await setDoc(chatRef, {
      last_message: message.message,
      last_message_at: serverTimestamp(),
      user_name: message.sender_name,
      user_id: chatId
    });
  }

  return messageRef;
};

export const subscribeToAllSupportChats = (callback: (chats: any[]) => void) => {
  const q = query(
    collection(db, 'support_chats'),
    orderBy('last_message_at', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(chats);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'support_chats');
  });
};

// Lawyer Directory
export const getLawyers = async () => {
  const q = query(
    collection(db, 'users'),
    where('user_type', '==', 'lawyer'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
};

// Clerk Directory
export const getClerks = async () => {
  const q = query(
    collection(db, 'users'),
    where('user_type', '==', 'clerk'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
};

// Archive Case History
export const searchArchiveCases = async (caseNumber: string) => {
  const q = query(
    collection(db, 'archive_cases'),
    where('caseNumber', '==', caseNumber),
    limit(10)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as unknown as ArchiveCase[];
};
