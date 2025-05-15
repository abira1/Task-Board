import { useState, useEffect } from 'react';
import {
  CheckIcon,
  TrashIcon,
  Loader2Icon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  AlertCircleIcon,
  FilterIcon,
  XCircleIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsPage = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    unreadCount,
    loading
  } = useNotifications();

  const [filter, setFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

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

    // Filter by read status
    if (showUnreadOnly && notification.read) {
      return false;
    }

    return true;
  });

  // Auto-mark notifications as read when they're viewed
  useEffect(() => {
    const markVisibleAsRead = async () => {
      if (loading || showUnreadOnly) return;

      // Wait a bit before marking as read to ensure the user has seen them
      const timer = setTimeout(async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
          for (const notification of unreadNotifications) {
            await markAsRead(notification.id);
          }
        }
      }, 3000);

      return () => clearTimeout(timer);
    };

    markVisibleAsRead();
  }, [loading, notifications, markAsRead, showUnreadOnly]);

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
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
          Notifications
        </h1>
        <p className="text-[#7a7067]">
          Stay updated with your tasks, events, and team activities
        </p>
      </header>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('task')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center ${
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
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center ${
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
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center ${
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
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center ${
              filter === 'system'
                ? 'bg-[#b8b87e] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            <AlertCircleIcon className="h-4 w-4 mr-1" />
            System
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center ${
              showUnreadOnly
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8]'
            }`}
          >
            {showUnreadOnly ? (
              <>
                <XCircleIcon className="h-4 w-4 mr-1" />
                Show All
              </>
            ) : (
              <>
                <FilterIcon className="h-4 w-4 mr-1" />
                Unread Only
              </>
            )}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-3 py-1.5 text-sm bg-white text-[#d4a5a5] hover:text-[#c99090] hover:bg-[#f5f0e8] rounded-lg transition-colors flex items-center"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark all read
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
                : showUnreadOnly
                  ? "You don't have any unread notifications"
                  : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f0e8]">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-5 hover:bg-[#f5f0e8]/30 transition-colors ${!notification.read ? 'bg-[#f5f0e8]/10' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center mr-4 shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="text-base font-medium text-[#3a3226]">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-[#7a7067] whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
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
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226]"
                        title="Mark as read"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="p-2 rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#d4a5a5]"
                      title="Delete notification"
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
