/**
 * Shortcut file generator for the Toiral Task Board PWA
 */

import { OperatingSystem, getShortcutMimeType } from './platformDetection';

// Application constants
const APP_NAME = 'Toiral Task Board';
const APP_DESCRIPTION = 'Task management application for Toiral';
const APP_URL = 'https://toiral-taskboard.web.app';
const APP_ICON_PATH = '/pwa-icons/icon-512x512.png';

/**
 * Generates a Windows .url shortcut file content
 */
function generateWindowsShortcut(): string {
  return `[InternetShortcut]
URL=${APP_URL}
IconIndex=0
IconFile=${APP_URL}${APP_ICON_PATH}`;
}

/**
 * Generates a macOS .webloc shortcut file content
 */
function generateMacOsShortcut(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>URL</key>
  <string>${APP_URL}</string>
</dict>
</plist>`;
}

/**
 * Generates a Linux .desktop shortcut file content
 */
function generateLinuxShortcut(): string {
  return `[Desktop Entry]
Type=Application
Name=${APP_NAME}
Comment=${APP_DESCRIPTION}
Exec=xdg-open ${APP_URL}
Icon=${APP_URL}${APP_ICON_PATH}
Terminal=false
Categories=Network;WebBrowser;`;
}

/**
 * Generates the appropriate shortcut file content based on the operating system
 */
export function generateShortcutContent(os: OperatingSystem): string {
  switch (os) {
    case 'windows':
      return generateWindowsShortcut();
    case 'macos':
      return generateMacOsShortcut();
    case 'linux':
      return generateLinuxShortcut();
    default:
      return generateWindowsShortcut(); // Default to Windows format
  }
}

/**
 * Creates and downloads a shortcut file for the specified operating system
 */
export function downloadShortcutFile(os: OperatingSystem): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Generate the shortcut content
      const content = generateShortcutContent(os);
      
      // Create a Blob with the shortcut content
      const blob = new Blob([content], { type: getShortcutMimeType(os) });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${APP_NAME.replace(/\s+/g, '-')}${os === 'windows' ? '.url' : os === 'macos' ? '.webloc' : '.desktop'}`;
      
      // Append the link to the document
      document.body.appendChild(link);
      
      // Click the link to start the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      resolve(true);
    } catch (error) {
      console.error('Error generating shortcut file:', error);
      reject(error);
    }
  });
}

/**
 * Returns platform-specific installation instructions
 */
export function getPlatformInstructions(os: OperatingSystem): {
  title: string;
  steps: string[];
} {
  switch (os) {
    case 'windows':
      return {
        title: 'Install on Windows',
        steps: [
          'Download the shortcut file',
          'Double-click the downloaded file to open Toiral Task Board',
          'In Chrome or Edge, click the install icon (⊕) in the address bar',
          'Click "Install" to add the app to your desktop'
        ]
      };
    case 'macos':
      return {
        title: 'Install on macOS',
        steps: [
          'Download the shortcut file',
          'Double-click the downloaded file to open Toiral Task Board',
          'In Chrome or Edge, click the install icon (⊕) in the address bar',
          'Click "Install" to add the app to your Applications folder'
        ]
      };
    case 'linux':
      return {
        title: 'Install on Linux',
        steps: [
          'Download the shortcut file',
          'Right-click the file and select "Properties"',
          'In the Permissions tab, check "Allow executing file as program"',
          'Double-click the file to open Toiral Task Board',
          'In Chrome, click the install icon (⊕) in the address bar',
          'Click "Install" to add the app to your applications'
        ]
      };
    case 'ios':
      return {
        title: 'Install on iOS',
        steps: [
          'Open Safari and navigate to Toiral Task Board',
          'Tap the Share button (rectangle with arrow) at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top-right corner',
          'The app will now appear on your home screen'
        ]
      };
    case 'android':
      return {
        title: 'Install on Android',
        steps: [
          'Open Chrome and navigate to Toiral Task Board',
          'Tap the menu button (three dots) in the top-right corner',
          'Tap "Install app" or "Add to Home screen"',
          'Follow the prompts to install',
          'The app will now appear on your home screen'
        ]
      };
    default:
      return {
        title: 'Install Toiral Task Board',
        steps: [
          'Open Chrome or Edge and navigate to Toiral Task Board',
          'Look for the install icon (⊕) in the address bar',
          'Click "Install" to add the app to your device'
        ]
      };
  }
}
