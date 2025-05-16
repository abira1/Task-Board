/**
 * Platform detection utility for the Toiral Task Board PWA
 */

export type OperatingSystem = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';

/**
 * Detects the user's operating system based on the user agent and platform information
 */
export function detectOperatingSystem(): OperatingSystem {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  // iOS detection
  if (/iphone|ipad|ipod/.test(userAgent) || 
      (/mac/.test(platform) && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  
  // Android detection
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  // Windows detection
  if (/win/.test(platform)) {
    return 'windows';
  }
  
  // macOS detection
  if (/mac/.test(platform) && !/iphone|ipad|ipod/.test(userAgent)) {
    return 'macos';
  }
  
  // Linux detection
  if (/linux/.test(platform) && !/android/.test(userAgent)) {
    return 'linux';
  }
  
  return 'unknown';
}

/**
 * Returns a human-readable name for the operating system
 */
export function getOperatingSystemName(os: OperatingSystem): string {
  switch (os) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    default:
      return 'Unknown';
  }
}

/**
 * Returns the file extension for the shortcut file based on the operating system
 */
export function getShortcutFileExtension(os: OperatingSystem): string {
  switch (os) {
    case 'windows':
      return '.url';
    case 'macos':
      return '.webloc';
    case 'linux':
      return '.desktop';
    default:
      return '.url'; // Default to Windows format
  }
}

/**
 * Returns the MIME type for the shortcut file based on the operating system
 */
export function getShortcutMimeType(os: OperatingSystem): string {
  switch (os) {
    case 'windows':
      return 'application/x-mswinurl';
    case 'macos':
      return 'application/xml';
    case 'linux':
      return 'application/x-desktop';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Checks if the current platform supports direct PWA installation
 */
export function supportsPwaInstallation(): boolean {
  // PWA installation is primarily supported on:
  // - Chrome, Edge, Opera, and Samsung Internet on Android
  // - Chrome, Edge, and Opera on desktop platforms
  // - Not supported on iOS Safari (requires manual "Add to Home Screen")
  
  const os = detectOperatingSystem();
  const userAgent = navigator.userAgent.toLowerCase();
  
  // iOS doesn't support programmatic PWA installation
  if (os === 'ios') {
    return false;
  }
  
  // Check for supported browsers
  const isChrome = /chrome|crios/.test(userAgent) && !/edge|edg|opr|opera/.test(userAgent);
  const isEdge = /edge|edg/.test(userAgent);
  const isOpera = /opr|opera/.test(userAgent);
  const isSamsungBrowser = /samsungbrowser/.test(userAgent);
  
  return isChrome || isEdge || isOpera || isSamsungBrowser;
}

/**
 * Checks if the app is already installed as a PWA
 */
export function isAppInstalledAsPwa(): boolean {
  // Check if the app is running in standalone mode or as a PWA
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}
