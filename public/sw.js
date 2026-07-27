self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});
self.addEventListener('fetch', (e) => {
  // Пустой обработчик нужен, чтобы браузер разрешил установку (PWA)
});