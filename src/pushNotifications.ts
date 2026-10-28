import { getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, getFirebaseMessaging } from './firebase';
import type { PartnerId } from './firestoreSync';

export async function registerPushToken(partner: PartnerId, roomCode: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in before enabling notifications.');
  if (!await isSupported()) throw new Error('This browser does not support Firebase background notifications.');

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('Firebase Web Push key is not configured. Add VITE_FIREBASE_VAPID_KEY and redeploy the app.');
  }
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  const token = await getToken(getFirebaseMessaging(), { vapidKey, serviceWorkerRegistration });
  if (!token) throw new Error('Firebase did not return a notification token.');
  await setDoc(doc(db, 'couples', roomCode, 'pushTokens', encodeURIComponent(token)), {
    token,
    uid: user.uid,
    partner,
    updatedAt: Date.now()
  });
}
