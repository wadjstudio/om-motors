const installButton = document.querySelector('#install-app');
let installPrompt;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = null;
  installButton.hidden = true;
  try { await prompt.prompt(); await prompt.userChoice; }
  catch (error) { console.warn('App installation prompt failed.', error); }
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
});
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('Offline app setup unavailable.', error);
    });
  });
}
