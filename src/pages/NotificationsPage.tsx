import { useState, useEffect, useRef } from 'react';
import {
  CheckIcon,
  TrashIcon,
  Loader2Icon,
  BellIcon,
  CheckCircleIcon,
  CalendarIcon,
  UsersIcon,
  AlertCircleIcon,
  VolumeXIcon,
  Volume2Icon,
  EyeIcon,
  EyeOffIcon,
  XIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage = () => {
  const { user } = useAuth();
  const {
    notifications,
    markAsSeen,
    markAllAsSeen,
    clearNotification,
    unseenCount,
    loading,
    notificationSettings,
    updateNotificationSettings,
    toggleSound
  } = useNotifications();

  const [filter, setFilter] = useState<string>('all');
  const [showUnseenOnly, setShowUnseenOnly] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [volumeValue, setVolumeValue] = useState<number>(notificationSettings.volume);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // Update local volume value when settings change
  useEffect(() => {
    setVolumeValue(notificationSettings.volume);
  }, [notificationSettings.volume]);

  // Audio reference for testing volume
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and clean up test audio
  useEffect(() => {
    // Initialize test audio
    testAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    // Clean up on component unmount
    return () => {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current = null;
      }
    };
  }, []);

  // Function to play a test sound with the current volume
  const playTestSound = () => {
    try {
      if (testAudioRef.current) {
        testAudioRef.current.volume = volumeValue;
        testAudioRef.current.currentTime = 0;
        testAudioRef.current.play().catch(err => console.error('Error playing test sound:', err));
      }
    } catch (error) {
      console.error("Error playing test sound:", error);
    }
  };

  // Format timestamp in a more human-readable way
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Just now (less than 1 minute ago)
    if (minutes < 1) return 'Just now';

    // Minutes
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Hours
    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Days
    if (days < 7) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    // Format as date for older notifications
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get filtered notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter !== 'all' && notification.type !== filter) {
      return false;
    }

    // Filter by seen status
    if (showUnseenOnly && user && notification.seenBy && notification.seenBy[user.id]) {
      return false;
    }

    return true;
  });

  // Handle click outside for volume slider
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeSliderRef.current &&
        !volumeSliderRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-mark notifications as seen when they're viewed
  useEffect(() => {
    const markVisibleAsSeen = async () => {
      if (loading || showUnseenOnly) return;

      // Wait a bit before marking as seen to ensure the user has seen them
      const timer = setTimeout(async () => {
        const unseenNotifications = notifications.filter(notification => {
          // Check if the notification is unseen by the current user
          return user && (!notification.seenBy || !notification.seenBy[user.id]);
        });

        if (unseenNotifications.length > 0) {
          for (const notification of unseenNotifications) {
            await markAsSeen(notification.id);
          }
        }
      }, 3000);

      return () => clearTimeout(timer);
    };

    markVisibleAsSeen();
  }, [loading, notifications, markAsSeen, showUnseenOnly, user]);

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

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'event':
        return <CalendarIcon className="h-5 w-5" />;
      case 'team':
        return <UsersIcon className="h-5 w-5" />;
      case 'system':
        return <AlertCircleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <header className="mb-6 md:mb-8">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          Notifications
        </h1>
        <p className="text-[#7a7067] text-sm md:text-base">
          Stay updated with your tasks, events, and team activities
        </p>
      </header>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Type filters - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center ${
              filter === 'all'
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('task')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center whitespace-nowrap min-h-[44px] ${
              filter === 'task'
                ? 'bg-[#7eb8ab] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Tasks
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center whitespace-nowrap min-h-[44px] ${
              filter === 'event'
                ? 'bg-[#8ca3d8] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Events
          </button>
          <button
            onClick={() => setFilter('team')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center whitespace-nowrap min-h-[44px] ${
              filter === 'team'
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            <UsersIcon className="h-4 w-4 mr-1" />
            Team
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center whitespace-nowrap min-h-[44px] ${
              filter === 'system'
                ? 'bg-[#b8b87e] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            <AlertCircleIcon className="h-4 w-4 mr-1" />
            System
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Sound toggle button */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="px-3 py-2 text-sm bg-white text-[#7a7067] hover:bg-[#f5f0e8] rounded-lg transition-colors flex items-center min-h-[44px]"
              title={notificationSettings.soundEnabled ? "Sound enabled" : "Sound disabled"}
              aria-label={notificationSettings.soundEnabled ? "Sound enabled" : "Sound disabled"}
            >
              {notificationSettings.soundEnabled ? (
                <>
                  <Volume2Icon className="h-4 w-4 mr-1" />
                  Sound
                </>
              ) : (
                <>
                  <VolumeXIcon className="h-4 w-4 mr-1" />
                  Sound
                </>
              )}
            </button>

            {/* Volume slider popup */}
            {showVolumeSlider && (
              <div
                ref={volumeSliderRef}
                className="volume-popup"
              >
                <div className="p-4">
                  {/* Header with title and controls */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#3a3226] font-medium">Notification Sound</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleSound}
                        className="text-[#7a7067] hover:text-[#3a3226] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#f5f0e8] transition-colors"
                        aria-label={notificationSettings.soundEnabled ? "Mute notifications" : "Unmute notifications"}
                      >
                        {notificationSettings.soundEnabled ? (
                          <Volume2Icon className="h-5 w-5" />
                        ) : (
                          <VolumeXIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowVolumeSlider(false)}
                        className="text-[#7a7067] hover:text-[#3a3226] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#f5f0e8] transition-colors"
                        aria-label="Close volume controls"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Current volume display */}
                  <div className="flex justify-center mb-3">
                    <div className="text-sm font-medium bg-[#f5f0e8] text-[#3a3226] px-4 py-1 rounded-full">
                      Volume: {Math.round(volumeValue * 100)}%
                    </div>
                  </div>

                  {/* Combined volume slider */}
                  <div className="mb-4">
                    {/* Simple percentage markers */}
                    <div className="flex justify-between text-xs text-[#7a7067] mb-1 px-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>

                    {/* Volume slider with fill effect */}
                    <div className="volume-slider-container">
                      <div
                        className="volume-slider-fill"
                        style={{ width: `${volumeValue * 100}%` }}
                      ></div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumeValue}
                        onChange={(e) => {
                          const newVolume = parseFloat(e.target.value);
                          setVolumeValue(newVolume);
                          updateNotificationSettings({ volume: newVolume });
                        }}
                        onTouchEnd={() => {
                          // Trigger haptic feedback if available
                          if (window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate(10);
                          }

                          // Play test sound when slider interaction ends
                          if (notificationSettings.soundEnabled) {
                            playTestSound();
                          }
                        }}
                        className="volume-slider w-full"
                        disabled={!notificationSettings.soundEnabled}
                        aria-label="Adjust notification volume"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(volumeValue * 100)}
                        aria-valuetext={`${Math.round(volumeValue * 100)}%`}
                      />
                    </div>
                  </div>

                  {/* Test sound button - simplified */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        playTestSound();
                        if (window.navigator && window.navigator.vibrate) {
                          window.navigator.vibrate(10);
                        }
                      }}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center justify-center min-h-[44px] min-w-[140px] ${
                        notificationSettings.soundEnabled
                          ? 'bg-[#d4a5a5] text-white hover:bg-[#c99090]'
                          : 'bg-[#e5e5e5] text-[#999999] cursor-not-allowed'
                      }`}
                      disabled={!notificationSettings.soundEnabled}
                      aria-label="Test notification sound"
                    >
                      <Volume2Icon className="h-4 w-4 mr-2" />
                      Test Sound
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unread filter button */}
          <button
            onClick={() => setShowUnseenOnly(!showUnseenOnly)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center min-h-[44px] ${
              showUnseenOnly
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
            aria-label={showUnseenOnly ? "Show all notifications" : "Show unseen notifications only"}
          >
            {showUnseenOnly ? (
              <>
                <EyeIcon className="h-4 w-4 mr-1" />
                Show All
              </>
            ) : (
              <>
                <EyeOffIcon className="h-4 w-4 mr-1" />
                Unseen Only
              </>
            )}
          </button>

          {/* Mark all as read button */}
          {unseenCount > 0 && (
            <button
              onClick={() => markAllAsSeen()}
              className="px-3 py-2 text-sm bg-white text-[#d4a5a5] hover:text-[#c99090] hover:bg-[#f5f0e8] rounded-lg transition-colors flex items-center min-h-[44px]"
              aria-label="Mark all notifications as seen"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark all as seen
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#7a7067] flex flex-col items-center">
            <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin mb-4" />
            <p className="text-lg">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-[#7a7067]">
            <BellIcon className="h-12 w-12 mx-auto mb-4 text-[#f5f0e8]" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-2">
              {filter !== 'all'
                ? `You don't have any ${filter} notifications`
                : showUnseenOnly
                  ? "You don't have any unseen notifications"
                  : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f0e8]">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 md:p-5 hover:bg-[#f5f0e8]/30 transition-colors ${
                  user && (!notification.seenBy || !notification.seenBy[user.id])
                    ? 'bg-[#f5f0e8]/20 border-l-4 border-[#d4a5a5]'
                    : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center mr-3 shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-base font-medium text-[#3a3226] break-words">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-[#7a7067] whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {user && (!notification.seenBy || !notification.seenBy[user.id]) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#d4a5a5] text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#7a7067] break-words">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:ml-4 shrink-0 self-end sm:self-start">
                    {user && (!notification.seenBy || !notification.seenBy[user.id]) && (
                      <button
                        onClick={() => markAsSeen(notification.id)}
                        className="p-2 rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226] min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Mark as seen"
                        aria-label="Mark notification as seen"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="p-2 rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#d4a5a5] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
