import supabase from '../src/supabaseClient';
import { messaging } from '../firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';

const TOKEN_CACHE_KEY = 'spv_fcm_token';

type EnsurePushOpts = {
  userId: string;
  userName?: string;
};

export async function ensureFcmTokenRegistered(opts: EnsurePushOpts): Promise<{ ok: boolean; token?: string; reason?: string }> {
  try {
    if (typeof window === 'undefined') return { ok: false, reason: 'not_in_browser' };
    if (!opts?.userId) return { ok: false, reason: 'missing_userId' };
    if (!('Notification' in window)) return { ok: false, reason: 'notifications_unsupported' };
    if (!('serviceWorker' in navigator)) return { ok: false, reason: 'sw_unsupported' };
    if (!messaging) return { ok: false, reason: 'firebase_messaging_not_configured' };

    const vapidKey =
      (import.meta as any)?.env?.VITE_FIREBASE_VAPID_KEY ||
      (import.meta as any)?.env?.VITE_FCM_VAPID_KEY ||
      (import.meta as any)?.env?.VITE_VAPID_KEY ||
      '';

    if (!vapidKey) return { ok: false, reason: 'missing_vapid_key' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'permission_not_granted' };

    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Keep the SW updated with user name for placeholder personalization
    try {
      const name = opts.userName || 'valued customer';
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'USER_DATA', name });
      } else {
        const ready = await navigator.serviceWorker.ready;
        ready.active?.postMessage?.({ type: 'USER_DATA', name });
      }
    } catch (_) {
      // ignore
    }

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
    if (!token) return { ok: false, reason: 'no_token' };

    const cached = localStorage.getItem(TOKEN_CACHE_KEY);
    if (cached !== token) {
      localStorage.setItem(TOKEN_CACHE_KEY, token);
      await supabase.from('users').update({ fcm_token: token } as any).eq('id', opts.userId);
    }

    // Foreground messages (when app is open)
    try {
      onMessage(messaging, (payload) => {
        const title = payload?.notification?.title;
        const body = payload?.notification?.body;
        if (title && body && Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      });
    } catch (_) {
      // ignore
    }

    return { ok: true, token };
  } catch (err: any) {
    console.warn('ensureFcmTokenRegistered failed:', err);
    return { ok: false, reason: err?.message || String(err) };
  }
}

// Back-compat entrypoint used by some call sites.
export const initializePushNotifications = async (userId?: string, userName?: string) => {
  if (!userId) return;
  await ensureFcmTokenRegistered({ userId, userName });
};
