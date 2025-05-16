import React, { useState, useEffect } from 'react';
import { WifiOffIcon, WifiIcon } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Function to update online status
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // Show reconnected message when coming back online
      if (online) {
        setShowReconnected(true);
        // Hide the reconnected message after 3 seconds
        setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }

      // Update the offline message in the HTML
      const offlineMessage = document.getElementById('offline-message');
      if (offlineMessage) {
        offlineMessage.style.display = online ? 'none' : 'block';
      }
    };

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Don't render anything if online and not showing reconnected message
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      {!isOnline && (
        <div className="bg-[#d4a5a5] text-white p-2 flex items-center justify-center text-sm">
          <WifiOffIcon className="h-4 w-4 mr-2" />
          <span>You are offline. Some features may be limited.</span>
        </div>
      )}
      
      {isOnline && showReconnected && (
        <div className="bg-[#3a3226] text-white p-2 flex items-center justify-center text-sm animate-fade-out">
          <WifiIcon className="h-4 w-4 mr-2" />
          <span>You're back online! Syncing data...</span>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;
