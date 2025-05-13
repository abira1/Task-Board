import React, { useState, createContext, useContext } from 'react';
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'team' | 'system';
  timestamp: Date;
  read: boolean;
}
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  unreadCount: number;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([{
    id: '1',
    title: 'New Task Assigned',
    message: 'You have been assigned to the Website Redesign task',
    type: 'task',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false
  }, {
    id: '2',
    title: 'Team Meeting',
    message: 'Weekly team meeting starts in 30 minutes',
    type: 'event',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: false
  }]);
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  };
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  const unreadCount = notifications.filter(n => !n.read).length;
  return <NotificationContext.Provider value={{
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    unreadCount
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