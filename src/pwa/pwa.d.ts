// PWA-specific type declarations

// Extend the Window interface to include PWA-specific events
interface WindowEventMap {
  'updateAvailable': CustomEvent;
  'offlineReady': CustomEvent;
  'installReady': CustomEvent<{ deferredPrompt: any }>;
  'installSuccess': CustomEvent;
}

// Extend the Navigator interface to include PWA-specific properties
interface Navigator {
  standalone?: boolean;
}

// Extend the ServiceWorkerRegistration interface to include periodicSync
interface ServiceWorkerRegistration {
  periodicSync?: {
    register: (tag: string, options?: { minInterval: number }) => Promise<void>;
    unregister: (tag: string) => Promise<void>;
    getTags: () => Promise<string[]>;
  };
}

// Declare the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Declare the virtual module for PWA registration
declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: any) => void;
  }): (reloadPage?: boolean) => Promise<void>;
}
