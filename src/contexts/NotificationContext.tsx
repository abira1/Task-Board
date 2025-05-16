import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { fetchData, addData, updateData, removeData, getDataOnce } from '../firebase/database';
import { defaultNotifications } from '../firebase/initData';
import { useAuth } from './AuthContext';

// User-specific seen status tracking
interface SeenStatus {
  [userId: string]: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'team' | 'system';
  timestamp: string; // Store as ISO string for Firebase compatibility
  read: boolean; // Legacy field, kept for backward compatibility
  seenBy: SeenStatus; // Track which users have seen this notification
  sound?: boolean; // Whether to play sound for this notification
}

// Type for creating a new notification
type NewNotification = Omit<Notification, 'id' | 'timestamp' | 'read' | 'seenBy'> & {
  sound?: boolean;
};

// Type for notification settings
interface NotificationSettings {
  soundEnabled: boolean;
  volume: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: NewNotification) => Promise<void>;
  markAsSeen: (id: string) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  unseenCount: number;
  loading: boolean;
  hasNewNotifications: boolean;
  clearNewNotificationsFlag: () => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const previousNotificationsRef = useRef<Notification[]>([]);

  // Load notification settings from localStorage or use defaults
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings
      ? JSON.parse(savedSettings)
      : { soundEnabled: true, volume: 0.5 };
  });

  // Save notification settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Update notification settings
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => {
      const newSettings = { ...prev, ...settings };
      return newSettings;
    });
  };

  // Toggle sound on/off
  const toggleSound = () => {
    updateNotificationSettings({ soundEnabled: !notificationSettings.soundEnabled });
  };

  // Fetch notifications from Firebase
  useEffect(() => {
    // Set loading to true initially
    setLoading(true);

    // If no user, just set empty notifications and stop loading
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let unsubscribeFunction: (() => void) | undefined;

    try {
      unsubscribeFunction = fetchData<Notification[]>(
        'notifications',
        (data) => {
          try {
            if (data) {
              // Ensure data is an array or convert it to one
              const notificationsArray = Array.isArray(data) ? data : Object.values(data);

              // Make sure each notification has a seenBy property
              const normalizedData = notificationsArray.map(notification => ({
                ...notification,
                seenBy: notification.seenBy || {}
              }));

              // Sort notifications by timestamp (newest first)
              const sortedData = [...normalizedData].sort((a, b) => {
                const timeA = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                const timeB = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                return timeA - timeB;
              });

              // Check for new notifications
              if (previousNotificationsRef.current.length > 0) {
                const newNotifications = sortedData.filter(notification => {
                  // Check if this notification wasn't in the previous list
                  const isNew = !previousNotificationsRef.current.some(
                    prevNotification => prevNotification.id === notification.id
                  );

                  // Or if it was, but the current user hasn't seen it yet
                  const isUnseen = !notification.seenBy?.[user.id];

                  return isNew && isUnseen;
                });

                if (newNotifications.length > 0) {
                  setHasNewNotifications(true);
                }
              }

              previousNotificationsRef.current = sortedData;
              setNotifications(sortedData);
            } else {
              // If no data, set empty array
              setNotifications([]);
            }
          } catch (error) {
            console.error("Error processing notifications:", error);
            // In case of error, set empty array
            setNotifications([]);
          } finally {
            // Always set loading to false when done
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setNotifications([]);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error setting up notification listener:", error);
      setNotifications([]);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (typeof unsubscribeFunction === 'function') {
        try {
          unsubscribeFunction();
        } catch (error) {
          console.error("Error unsubscribing from notifications:", error);
        }
      }
    };
  }, [user]);

  // Clear the new notifications flag
  const clearNewNotificationsFlag = () => {
    setHasNewNotifications(false);
  };

  // Add a new notification
  const addNotification = async (notification: NewNotification) => {
    try {
      if (!user) return;

      // Initialize with empty seenBy object
      const newNotification = {
        ...notification,
        timestamp: new Date().toISOString(),
        read: false,
        seenBy: {}
      };

      await addData('notifications', newNotification);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Mark a notification as seen by the current user
  const markAsSeen = async (id: string) => {
    try {
      if (!user) return;

      // Get the current notification
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;

      // Update the seenBy field for the current user
      const updatedSeenBy = {
        ...notification.seenBy,
        [user.id]: true
      };

      // Update in Firebase
      await updateData('notifications', id, {
        seenBy: updatedSeenBy,
        // Also update the legacy read field for backward compatibility
        read: true
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, seenBy: updatedSeenBy, read: true }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  // Mark all notifications as seen by the current user
  const markAllAsSeen = async () => {
    try {
      if (!user) return;

      // Get all unseen notifications for the current user
      const unseenNotifications = notifications.filter(
        n => !n.seenBy || !n.seenBy[user.id]
      );

      if (unseenNotifications.length === 0) return;

      // Update each notification individually
      const promises = unseenNotifications.map(notification => {
        const updatedSeenBy = {
          ...notification.seenBy,
          [user.id]: true
        };

        return updateData('notifications', notification.id, {
          seenBy: updatedSeenBy,
          read: true // Update legacy field
        });
      });

      await Promise.all(promises);

      // Update local state
      setNotifications(prev =>
        prev.map(n => {
          if (!n.seenBy || !n.seenBy[user.id]) {
            return {
              ...n,
              seenBy: { ...n.seenBy, [user.id]: true },
              read: true
            };
          }
          return n;
        })
      );

      // Clear new notifications flag
      clearNewNotificationsFlag();
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
    }
  };

  // Delete a notification
  const clearNotification = async (id: string) => {
    try {
      await removeData('notifications', id);

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  // Count unseen notifications for the current user
  const unseenCount = user
    ? notifications.filter(n => !n.seenBy || !n.seenBy[user.id]).length
    : 0;

  return <NotificationContext.Provider value={{
    notifications,
    addNotification,
    markAsSeen,
    markAllAsSeen,
    clearNotification,
    unseenCount,
    loading,
    hasNewNotifications,
    clearNewNotificationsFlag,
    notificationSettings,
    updateNotificationSettings,
    toggleSound
  }}>
      {children}
    </NotificationContext.Provider>;
};
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};