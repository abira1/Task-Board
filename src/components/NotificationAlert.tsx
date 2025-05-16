import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, XIcon, VolumeXIcon, Volume2Icon } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

// Notification sound
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const NotificationAlert: React.FC = () => {
  const {
    notifications,
    hasNewNotifications,
    clearNewNotificationsFlag,
    markAsSeen,
    notificationSettings,
    toggleSound
  } = useNotifications();

  const [showAlert, setShowAlert] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  // Initialize audio element
  useEffect(() => {
    try {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      if (notificationSettings?.volume !== undefined) {
        audioRef.current.volume = notificationSettings.volume;
      } else {
        audioRef.current.volume = 0.5; // Default volume
      }

      // Preload the audio
      audioRef.current.load();
    } catch (error) {
      console.error("Error initializing audio:", error);
    }

    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current = null;
        } catch (error) {
          console.error("Error cleaning up audio:", error);
        }
      }
    };
  }, []);

  // Update audio volume when settings change
  useEffect(() => {
    if (audioRef.current && notificationSettings?.volume !== undefined) {
      try {
        audioRef.current.volume = notificationSettings.volume;
      } catch (error) {
        console.error("Error updating audio volume:", error);
      }
    }
  }, [notificationSettings?.volume]);

  // Show notification alert when new notifications arrive
  useEffect(() => {
    try {
      if (hasNewNotifications && notifications && notifications.length > 0) {
        // Find the newest unseen notification
        const newestNotification = [...notifications].sort((a, b) =>
          new Date(b.timestamp || Date.now()).getTime() - new Date(a.timestamp || Date.now()).getTime()
        )[0];

        if (newestNotification) {
          setCurrentNotification(newestNotification);
          setShowAlert(true);

          // Play sound if enabled
          if (notificationSettings?.soundEnabled && newestNotification.sound !== false) {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(err => console.error('Error playing notification sound:', err));
            }
          }

          // Auto-hide after 5 seconds
          const timer = setTimeout(() => {
            setShowAlert(false);
          }, 5000);

          return () => clearTimeout(timer);
        }
      }
    } catch (error) {
      console.error("Error showing notification alert:", error);
      setShowAlert(false);
    }
  }, [hasNewNotifications, notifications, notificationSettings?.soundEnabled]);

  // Handle closing the alert
  const handleClose = () => {
    setShowAlert(false);
    clearNewNotificationsFlag();
  };

  // Handle clicking on the notification
  const handleClick = () => {
    if (currentNotification) {
      // Mark as seen
      markAsSeen(currentNotification.id);

      // Navigate to notifications page
      navigate('/notifications');

      // Close the alert
      setShowAlert(false);
      clearNewNotificationsFlag();
    }
  };

  // Get notification type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-[#e8f3f1] text-[#7eb8ab]';
      case 'event':
        return 'bg-[#e8ecf3] text-[#8ca3d8]';
      case 'team':
        return 'bg-[#f5eee8] text-[#d4a5a5]';
      default:
        return 'bg-[#f5f0e8] text-[#7a7067]';
    }
  };

  if (!showAlert || !currentNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-pulse">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-[#f5f0e8]">
        <div className="p-4">
          <div className="flex items-start">
            <div className={`w-10 h-10 rounded-full ${getTypeColor(currentNotification.type)} flex items-center justify-center mr-3 flex-shrink-0`}>
              <BellIcon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[#3a3226] font-medium text-base mb-1">
                  {currentNotification.title}
                </h4>
                <div className="flex items-center ml-2">
                  <button
                    onClick={toggleSound}
                    className="p-1.5 text-[#7a7067] hover:text-[#3a3226] rounded-full hover:bg-[#f5f0e8] transition-colors"
                    title={notificationSettings.soundEnabled ? "Mute notifications" : "Unmute notifications"}
                  >
                    {notificationSettings.soundEnabled ? (
                      <Volume2Icon className="h-4 w-4" />
                    ) : (
                      <VolumeXIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-1.5 text-[#7a7067] hover:text-[#3a3226] rounded-full hover:bg-[#f5f0e8] transition-colors"
                    title="Close"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-[#7a7067] text-sm line-clamp-2">
                {currentNotification.message}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClick}
          className="w-full p-2 bg-[#f5f0e8] text-[#3a3226] text-sm font-medium hover:bg-[#d4a5a5] hover:text-white transition-colors text-center"
        >
          View Notification
        </button>
      </div>
    </div>
  );
};

export default NotificationAlert;
