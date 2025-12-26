import { useState } from 'react';
import {
  TrashIcon,
  Loader2Icon,
  BellIcon,
  CheckCircleIcon,
  CalendarIcon,
  EyeIcon,
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
    loading
  } = useNotifications();

  const [filter, setFilter] = useState<string>('all');
  const [showUnseenOnly, setShowUnseenOnly] = useState<boolean>(false);

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
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <header className="mb-6 md:mb-8">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          Notifications
        </h1>
        <p className="text-[#7a7067] text-sm md:text-base">
          Stay updated with your tasks and events
        </p>
      </header>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Type filters - Only Task and Event */}
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8] border border-[#f5f0e8]'
            }`}
            data-testid="filter-all-button"
          >
            All
          </button>
          <button
            onClick={() => setFilter('task')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center whitespace-nowrap ${
              filter === 'task'
                ? 'bg-[#7eb8ab] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8] border border-[#f5f0e8]'
            }`}
            data-testid="filter-task-button"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Tasks
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center whitespace-nowrap ${
              filter === 'event'
                ? 'bg-[#8ca3d8] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8] border border-[#f5f0e8]'
            }`}
            data-testid="filter-event-button"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Events
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Unseen filter button */}
          <button
            onClick={() => setShowUnseenOnly(!showUnseenOnly)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center ${
              showUnseenOnly
                ? 'bg-[#d4a5a5] text-white'
                : 'bg-white text-[#7a7067] hover:bg-[#f5f0e8] border border-[#f5f0e8]'
            }`}
            data-testid="unseen-only-toggle"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            {showUnseenOnly ? 'Show All' : 'Unseen Only'}
          </button>

          {/* Mark all as seen button */}
          {unseenCount > 0 && (
            <button
              onClick={() => markAllAsSeen()}
              className="px-4 py-2 text-sm bg-white text-[#d4a5a5] hover:text-[#c99090] hover:bg-[#f5f0e8] border border-[#f5f0e8] rounded-lg transition-colors"
              data-testid="mark-all-seen-button"
            >
              Clear all ({unseenCount})
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#f5f0e8]">
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
          <div>
            {filteredNotifications.map(notification => {
              const isUnseen = user && (!notification.seenBy || !notification.seenBy[user.id]);
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[#f5f0e8] last:border-b-0 hover:bg-[#f5f0e8]/20 transition-colors ${
                    isUnseen ? 'bg-[#f5f0e8]/10' : ''
                  }`}
                  data-testid="notification-item"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-2xl flex-shrink-0">{getTypeIcon(notification.type)}</span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm text-[#3a3226] break-words flex-1">
                          {notification.message}
                        </p>
                        {isUnseen && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#d4a5a5] text-white whitespace-nowrap">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#7a7067]">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isUnseen && (
                        <button
                          onClick={() => markAsSeen(notification.id)}
                          className="p-2 rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226]"
                          title="Mark as seen"
                          data-testid="mark-seen-button"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="p-2 rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#d4a5a5]"
                        title="Delete notification"
                        data-testid="delete-notification-button"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
