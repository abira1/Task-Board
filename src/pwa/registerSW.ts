import { registerSW } from 'virtual:pwa-register';

// Add TypeScript declaration for the virtual module
declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: any) => void;
  }): (reloadPage?: boolean) => Promise<void>;
}

export function setupPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Show a notification to the user that there's an update available
      if (confirm('New content available. Reload to update?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      // You could show a notification here if you want
      const offlineReadyEvent = new CustomEvent('offlineReady');
      window.dispatchEvent(offlineReadyEvent);
    },
    onRegistered(registration) {
      if (registration) {
        console.log('Service worker registered');
        
        // Setup periodic sync if supported
        if ('periodicSync' in registration) {
          // This is a future API, not widely supported yet
          console.log('Periodic sync supported');
        }
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration error:', error);
    }
  });

  return updateSW;
}

// Function to check if the app can be installed
export function checkInstallability() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to notify the user they can install the PWA
    const installReadyEvent = new CustomEvent('installReady', { detail: { deferredPrompt } });
    window.dispatchEvent(installReadyEvent);
  });

  // When the app is installed, clear the prompt
  window.addEventListener('appinstalled', () => {
    // Hide the app-provided install promotion
    const installSuccessEvent = new CustomEvent('installSuccess');
    window.dispatchEvent(installSuccessEvent);
    // Clear the deferredPrompt
    deferredPrompt = null;
    console.log('PWA was installed');
  });
}

// Function to request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Initialize PWA features
export function initPWA() {
  setupPWA();
  checkInstallability();
  
  // Request notification permission when appropriate
  // This should typically be done after user interaction
  // or in response to a specific user action
  // requestNotificationPermission();
}
