// Minimal Firebase Messaging service worker placeholder
// Ensure this file exists at the project root /public to avoid missing-file / MIME errors.
self.addEventListener('push', function(event) {
  try {
    const data = event.data && event.data.json ? event.data.json() : {};
    const title = data.title || 'Spoil Me Vintage';
    const options = {
      body: data.body || '',
      data: data.data || {}
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // fallback
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/') );
});
