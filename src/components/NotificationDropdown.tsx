import { useEffect, useState, useRef } from 'react';
import { BellIcon, XIcon } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const {
    notifications,
    unseenCount,
    markAllAsSeen,
    clearNotification
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'event':
        return '📅';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        data-testid="notification-bell-button"
      >
        <BellIcon className="h-5 w-5 text-[#7a7067]" />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d4a5a5] text-white text-xs rounded-full flex items-center justify-center">
            {unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown container with proper positioning */}
      {isOpen && (
        <div
          className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-16 md:top-10 z-[60]"
          style={{
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 120px)'
          }}
        >
          {/* Dropdown content - More minimal */}
          <div className="bg-white rounded-lg shadow-lg border border-[#f5f0e8] overflow-hidden flex flex-col max-h-[calc(100vh-120px)] w-[340px] max-w-full">
            <div className="p-3 border-b border-[#f5f0e8] flex-shrink-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-[#3a3226] font-medium text-sm">Notifications</h3>
                {unseenCount > 0 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      markAllAsSeen();
                    }}
                    className="text-xs text-[#d4a5a5] hover:text-[#c99090] py-1 px-2 rounded"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#7a7067] text-sm">
                  No notifications
                </div>
              ) : (
                <div>
                  {notifications.map(notification => {
                    const isUnseen = user && (!notification.seenBy || !notification.seenBy[user.id]);
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-[#f5f0e8] hover:bg-[#f5f0e8]/20 transition-colors ${isUnseen ? 'bg-[#f5f0e8]/10' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{getTypeIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-[#3a3226] break-words flex-1">
                                {notification.message}
                              </p>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="p-1 rounded hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#d4a5a5] flex-shrink-0"
                                aria-label="Delete notification"
                              >
                                <XIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-xs text-[#7a7067] mt-1 block">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;