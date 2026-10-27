self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Could not parse push notification payload:', error);
    payload = { title: 'Daily SideQuests', body: 'You have a new update.' };
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Daily SideQuests', {
    body: payload.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url || '/' }
  }));
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
