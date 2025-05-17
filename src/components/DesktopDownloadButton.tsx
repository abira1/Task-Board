import React, { useState, useEffect } from 'react';
import { DownloadIcon, XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const DesktopDownloadButton: React.FC = () => {
  const [showButton, setShowButton] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if the user has dismissed the button recently
    const dismissedTime = localStorage.getItem('downloadButtonDismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      // Show again after 7 days
      if ((now.getTime() - dismissedDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Only show on desktop viewports
    const checkViewport = () => {
      if (window.innerWidth >= 1024) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    // Check on initial load
    checkViewport();

    // Check on resize
    window.addEventListener('resize', checkViewport);

    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  const dismissButton = () => {
    setShowButton(false);
    // Store in localStorage that the user dismissed the button
    localStorage.setItem('downloadButtonDismissed', Date.now().toString());
  };

  if (!showButton || isInstalled) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isExpanded ? 'w-64 bg-[#f5f0e8] rounded-lg shadow-lg' : 'w-auto'
      }`}
    >
      {isExpanded ? (
        <div className="p-4 border border-[#d4a5a5] rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <div className="mr-2 bg-[#d4a5a5] rounded-full p-1.5">
                <DownloadIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-[#3a3226] font-medium text-sm">Install App</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[#7a7067] hover:text-[#3a3226] transition-colors"
              aria-label="Collapse"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[#7a7067] text-xs mb-3">
            Install Toiral Task Board as a desktop app for quick access anytime.
          </p>
          <div className="flex space-x-2">
            <Link
              to="/download"
              className="flex-1 bg-[#d4a5a5] hover:bg-[#c99595] text-white text-xs font-medium py-2 px-3 rounded-md transition-colors text-center"
            >
              Download
            </Link>
            <button
              onClick={dismissButton}
              className="bg-white border border-[#d4a5a5] text-[#d4a5a5] hover:bg-[#f5eee8] text-xs font-medium py-2 px-3 rounded-md transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-[#d4a5a5] hover:bg-[#c99595] text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
          aria-label="Download App"
        >
          <DownloadIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default DesktopDownloadButton;
