import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// 1. Prevent multiple initializations in the same session
let isInitialized = false;

export const initializePushNotifications = async (userId: string) => {
  if (isInitialized) {
    console.log("Push notifications already initialized. Skipping.");
    return;
  }
  if (userId === "guest") {
    console.log("Skipping push notifications for guest user.");
    return;
  }
  isInitialized = true;

  try {
    // === SCENARIO A: NATIVE APP (Android/iOS) ===
    if (Capacitor.isNativePlatform()) {
      console.log("Initializing Native Push...");

      // 1. Request Permission
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.error("User denied permissions!");
        return;
      }

      // 2. Register with Apple/Google
      await PushNotifications.register();

      // 3. Listen for the Token (This is the device ID)
      PushNotifications.addListener('registration', (token) => {
        console.log('Native Token:', token.value);
        saveTokenToSubCollection(userId, token.value, 'native');
      });

      // 4. Listen for Notification Click (Deep Linking)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        const data = notification.notification.data;
        if (data.url) {
          window.location.href = data.url; // Navigate user to specific page
        }
      });
    }

    // === SCENARIO B: WEBSITE (Chrome/Safari) ===
    else {
      console.log("Initializing Web Push...");
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BEZuB_F1gXmTyk47fzfgaEWXKTluRTYdB1MVSyfvQhjkueVbpPywG1vIAUeLVwUsvWcb1a4RE3aver4Ds8wcx8M'
          });
          console.log('Web Token:', token);
          saveTokenToSubCollection(userId, token, 'web');
        }
      } catch (error) {
        console.error("Web Push Error:", error);
      }
    }
  } catch (error) {
    console.error("Push Init Error:", error);
  }
};

// 2. NEW SAVING LOGIC (Sub-collection)
const saveTokenToSubCollection = async (userId: string, token: string, platform: string) => {
  if (!userId || !token) return;

  try {
    // We use the token itself as the ID to prevent duplicates automatically
    // Sanitize token for use as ID (remove special chars if any, though usually safe)
    const deviceId = platform === 'web' ? 'web_device' : 'mobile_device';

    // Actually, let's just use a fixed ID for "current web session" to prevent bloat
    // Or use the token string as a check
    const tokenRef = doc(db, 'users', userId, 'push_tokens', token.slice(0, 20)); // Use part of token as ID to spread them out

    await setDoc(tokenRef, {
      token: token,
      platform: platform,
      lastSeen: serverTimestamp(),
      userAgent: navigator.userAgent
    }, { merge: true });

    console.log("Token saved to sub-collection securely.");
  } catch (error) {
    console.error("Error saving token:", error);
  }
};
