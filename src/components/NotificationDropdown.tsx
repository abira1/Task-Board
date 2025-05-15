import { useEffect, useState, useRef } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
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

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5 text-[#7a7067]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d4a5a5] text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown container with proper positioning */}
      {isOpen && (
        <div
          className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-16 md:top-10 z-[60] transform origin-top transition-all duration-200 ease-in-out animate-dropdown"
          style={{
            width: 'auto',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 100px)'
          }}
        >
          {/* Dropdown content */}
          <div className="bg-white rounded-xl shadow-lg border border-[#f5f0e8] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#f5f0e8] flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-[#3a3226] font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs text-[#d4a5a5] hover:text-[#c99090] py-1 px-2 rounded"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-grow">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[#7a7067] text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-[#f5f0e8]">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-[#f5f0e8]/30 transition-colors ${!notification.read ? 'bg-[#f5f0e8]/10' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getTypeColor(notification.type)}`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 rounded hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226]"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="p-1 rounded hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#d4a5a5]"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-[#3a3226] mt-2 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-[#7a7067] mb-2 break-words">
                        {notification.message}
                      </p>
                      <span className="text-xs text-[#7a7067]">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                  ))}
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