import React, { useState, useEffect } from 'react';
import { DownloadIcon, XIcon } from 'lucide-react';

interface InstallPromptProps {
  className?: string;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ className = '' }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for the installReady event
    const handleInstallReady = (event: CustomEvent) => {
      setDeferredPrompt(event.detail.deferredPrompt);
      setShowPrompt(true);
    };

    // Listen for the installSuccess event
    const handleInstallSuccess = () => {
      setShowPrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener('installReady', handleInstallReady as EventListener);
    window.addEventListener('installSuccess', handleInstallSuccess);

    return () => {
      window.removeEventListener('installReady', handleInstallReady as EventListener);
      window.removeEventListener('installSuccess', handleInstallSuccess);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We no longer need the prompt regardless of outcome
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Store in localStorage that the user dismissed the prompt
    // to avoid showing it again too soon
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 bg-[#f5f0e8] border-t border-[#d4a5a5] z-40 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 bg-[#d4a5a5] rounded-full p-2">
            <DownloadIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[#3a3226] font-medium">Install Toiral Task Board</p>
            <p className="text-[#7a7067] text-sm">Add to home screen for quick access</p>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleInstall}
            className="bg-[#d4a5a5] text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
          >
            Install
          </button>
          <button
            onClick={dismissPrompt}
            className="text-[#7a7067] p-2"
            aria-label="Dismiss"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
