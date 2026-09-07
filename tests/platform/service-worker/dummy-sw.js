addEventListener('install', () => skipWaiting());
addEventListener('activate', (event) => event.waitUntil(clients.claim()));
addEventListener('message', (event) => {
  if (event.data === 'ping') event.source.postMessage('pong');
});
