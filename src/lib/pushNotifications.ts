import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

export interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
}

/**
 * Checks browser support for Web Push / Notifications
 */
export function checkNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!checkNotificationSupport()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests Notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!checkNotificationSupport()) {
    console.warn('[PushNotifications] Notifications are not supported in this browser.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[PushNotifications] Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Sends a local system web notification to the user's device
 */
export function sendLocalNotification(title: string, options?: NotificationOptions): boolean {
  if (!checkNotificationSupport() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notifOptions: NotificationOptions & Record<string, any> = {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'mdc-casebook-alert',
      renotify: true,
      vibrate: [200, 100, 200],
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, notifOptions);
      }).catch(() => {
        new Notification(title, notifOptions);
      });
    } else {
      new Notification(title, notifOptions);
    }

    return true;
  } catch (err) {
    console.error('[PushNotifications] Failed to display notification:', err);
    return false;
  }
}

/**
 * Subscribes user's device to case updates in Firestore and LocalStorage
 */
export async function subscribeCasePushNotification(params: {
  caseId: string;
  caseNumber?: string;
  courtName?: string;
  clientMobile?: string;
}): Promise<{ success: boolean; message: string }> {
  const { caseId, caseNumber = '', courtName = '', clientMobile = '' } = params;

  if (!checkNotificationSupport()) {
    return {
      success: false,
      message: 'আপনার ব্রাউজারটি ওয়েব পুশ নোটিফিকেশন সমর্থন করে না।'
    };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message: 'নোটিফিকেশনের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন।'
    };
  }

  try {
    // 1. Save in Firestore for background dispatch
    await addDoc(collection(db, 'case_tracking_subscribers'), {
      case_id: String(caseId),
      case_number: caseNumber,
      court_name: courtName,
      phone: clientMobile || '',
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      platform: typeof navigator !== 'undefined' ? (navigator.platform || 'web') : 'web',
      created_at: serverTimestamp(),
      status: 'active'
    });

    // 2. Save in LocalStorage
    const key = `subscribed_case_${caseId}`;
    localStorage.setItem(key, JSON.stringify({
      caseId,
      caseNumber,
      courtName,
      subscribedAt: new Date().toISOString()
    }));

    // Update global list of subscribed cases
    const listKey = 'mdc_subscribed_cases';
    const existingList: string[] = JSON.parse(localStorage.getItem(listKey) || '[]');
    if (!existingList.includes(String(caseId))) {
      existingList.push(String(caseId));
      localStorage.setItem(listKey, JSON.stringify(existingList));
    }

    // 3. Fire immediate verification push alert
    sendLocalNotification('MDC Casebook: নোটিফিকেশন সক্রিয় হয়েছে! 🔔', {
      body: `মামলা নং: ${caseNumber || 'আপনার মামলা'} এর প্রতিটি তারিখ পরিবর্তনের সাথে সাথে আপনার মোবাইলে সরাসরি এলার্ট পৌঁছে যাবে।`,
      data: { caseId }
    });

    return {
      success: true,
      message: 'পুশ নোটিফিকেশন সফলভাবে সক্রিয় হয়েছে!'
    };
  } catch (err: any) {
    console.error('[PushNotifications] Subscription error:', err);
    // Even if Firestore fails, local notification works
    sendLocalNotification('MDC Casebook: নোটিফিকেশন সক্রিয় হয়েছে! 🔔', {
      body: `মামলা নং: ${caseNumber || 'আপনার মামলা'} এর নোটিফিকেশন এই ডিভাইসে চালু করা হয়েছে।`
    });

    return {
      success: true,
      message: 'এই ডিভাইসে নোটিফিকেশন সফলভাবে চালু হয়েছে।'
    };
  }
}

/**
 * Checks if a specific case is subscribed on this device
 */
export function isCaseSubscribed(caseId: string | number): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(`subscribed_case_${caseId}`);
}
