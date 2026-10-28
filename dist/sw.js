importScripts('https://www.gstatic.com/firebasejs/11.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.3.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC1tR-idMqLiC8xxwCgnxF1YqWOn4H7C4A',
  authDomain: 'couplequests-4faa5.firebaseapp.com',
  projectId: 'couplequests-4faa5',
  storageBucket: 'couplequests-4faa5.firebasestorage.app',
  messagingSenderId: '633537838047',
  appId: '1:633537838047:web:e3f6d7ab7183e84323c57c'
});

firebase.messaging().onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || payload.data?.title || 'Daily SideQuests';
  const body = notification.body || payload.data?.body || 'You have a new update.';
  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.fcmOptions?.link || '/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client && client.url !== destination) await client.navigate(destination);
        return;
      }
    }
    await self.clients.openWindow(destination);
  })());
});
