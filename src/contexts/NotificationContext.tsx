import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultNotifications } from '../firebase/initData';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'team' | 'system';
  timestamp: string; // Store as ISO string for Firebase compatibility
  read: boolean;
}

// Type for creating a new notification
type NewNotification = Omit<Notification, 'id' | 'timestamp' | 'read'>;

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: NewNotification) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  unreadCount: number;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // Fetch notifications from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Notification[]>('notifications', (data) => {
      if (data) {
        // Sort notifications by timestamp (newest first)
        const sortedData = [...data].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(sortedData);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addNotification = async (notification: NewNotification) => {
    try {
      const newNotification = {
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
      };

      await addData('notifications', newNotification);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateData('notifications', id, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update each notification individually
      const promises = notifications.map(notification =>
        updateData('notifications', notification.id, { read: true })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await removeData('notifications', id);
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return <NotificationContext.Provider value={{
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    unreadCount,
    loading
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