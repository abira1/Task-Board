import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData, getDataOnce } from '../firebase/database';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank' | 'card' | 'online';
  details: {
    [key: string]: string; // Flexible structure for different payment methods
  };
  isActive: boolean;
}

export interface PaymentSettings {
  methods: PaymentMethod[];
  defaultMethod?: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

// Type for creating a new payment method
export type NewPaymentMethod = Omit<PaymentMethod, 'id'>;

interface PaymentContextType {
  paymentSettings: PaymentSettings | null;
  getPaymentMethods: () => PaymentMethod[];
  getActivePaymentMethods: () => PaymentMethod[];
  getPaymentMethod: (id: string) => PaymentMethod | null;
  addPaymentMethod: (method: NewPaymentMethod) => Promise<string | null>;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<any>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshPaymentSettings: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const { user, isAdmin } = useAuth();
  const { addNotification } = useNotifications();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment settings on component mount
  useEffect(() => {
    const unsubscribe = fetchPaymentSettings();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch payment settings from Firebase
  const fetchPaymentSettings = () => {
    setLoading(true);
    setError(null);

    try {
      return fetchData<PaymentSettings>(
        'paymentSettings',
        (data) => {
          if (data) {
            setPaymentSettings(data);
          } else {
            // Initialize with empty settings if none exist
            setPaymentSettings({
              methods: [],
              updatedAt: new Date().toISOString(),
              updatedBy: {
                id: user?.id || 'system',
                name: user?.name || 'System'
              }
            });
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching payment settings:', err);
          setError('Failed to load payment settings. Please try again later.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up payment settings listener:', error);
      setError('Failed to connect to the database. Please check your connection.');
      setLoading(false);
      return () => {}; // Return empty function if setup fails
    }
  };

  // Get all payment methods
  const getPaymentMethods = (): PaymentMethod[] => {
    return paymentSettings?.methods || [];
  };

  // Get only active payment methods
  const getActivePaymentMethods = (): PaymentMethod[] => {
    return (paymentSettings?.methods || []).filter(method => method.isActive);
  };

  // Get a single payment method by ID
  const getPaymentMethod = (id: string): PaymentMethod | null => {
    const method = paymentSettings?.methods.find(m => m.id === id);
    return method || null;
  };

  // Add a new payment method
  const addPaymentMethod = async (method: NewPaymentMethod): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!isAdmin()) {
        throw new Error('Only administrators can manage payment methods');
      }

      // Generate a unique ID for the method
      const methodId = `method_${Date.now()}`;

      // Create a copy of the current settings
      const updatedSettings = { ...paymentSettings } as PaymentSettings;
      
      // Initialize methods array if it doesn't exist
      if (!updatedSettings.methods) {
        updatedSettings.methods = [];
      }

      // Add the new method
      updatedSettings.methods.push({
        ...method,
        id: methodId
      });

      // Update metadata
      updatedSettings.updatedAt = new Date().toISOString();
      updatedSettings.updatedBy = {
        id: user.id,
        name: user.name
      };

      // Update in Firebase
      await updateData('', 'paymentSettings', updatedSettings);

      // Update local state
      setPaymentSettings(updatedSettings);

      // Add notification
      await addNotification({
        title: 'Payment Method Added',
        message: `${method.name} payment method has been added`,
        type: 'system'
      });

      return methodId;
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError(error instanceof Error ? error.message : 'Failed to add payment method');
      return null;
    }
  };

  // Update an existing payment method
  const updatePaymentMethod = async (id: string, methodData: Partial<PaymentMethod>) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!isAdmin()) {
        throw new Error('Only administrators can manage payment methods');
      }

      if (!paymentSettings) {
        throw new Error('Payment settings not loaded');
      }

      // Create a copy of the current settings
      const updatedSettings = { ...paymentSettings };
      
      // Find and update the method
      const methodIndex = updatedSettings.methods.findIndex(m => m.id === id);
      if (methodIndex === -1) {
        throw new Error('Payment method not found');
      }

      updatedSettings.methods[methodIndex] = {
        ...updatedSettings.methods[methodIndex],
        ...methodData
      };

      // Update metadata
      updatedSettings.updatedAt = new Date().toISOString();
      updatedSettings.updatedBy = {
        id: user.id,
        name: user.name
      };

      // Update in Firebase
      await updateData('', 'paymentSettings', updatedSettings);

      // Update local state
      setPaymentSettings(updatedSettings);

      // Add notification
      await addNotification({
        title: 'Payment Method Updated',
        message: `Payment method has been updated`,
        type: 'system'
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      setError(error instanceof Error ? error.message : 'Failed to update payment method');
      throw error;
    }
  };

  // Remove a payment method
  const removePaymentMethod = async (id: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!isAdmin()) {
        throw new Error('Only administrators can manage payment methods');
      }

      if (!paymentSettings) {
        throw new Error('Payment settings not loaded');
      }

      // Create a copy of the current settings
      const updatedSettings = { ...paymentSettings };
      
      // Remove the method
      updatedSettings.methods = updatedSettings.methods.filter(m => m.id !== id);

      // If the removed method was the default, clear the default
      if (updatedSettings.defaultMethod === id) {
        delete updatedSettings.defaultMethod;
      }

      // Update metadata
      updatedSettings.updatedAt = new Date().toISOString();
      updatedSettings.updatedBy = {
        id: user.id,
        name: user.name
      };

      // Update in Firebase
      await updateData('', 'paymentSettings', updatedSettings);

      // Update local state
      setPaymentSettings(updatedSettings);

      // Add notification
      await addNotification({
        title: 'Payment Method Removed',
        message: `A payment method has been removed`,
        type: 'system'
      });

      return { success: true, message: 'Payment method deleted successfully' };
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  };

  // Set default payment method
  const setDefaultPaymentMethod = async (id: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!isAdmin()) {
        throw new Error('Only administrators can manage payment methods');
      }

      if (!paymentSettings) {
        throw new Error('Payment settings not loaded');
      }

      // Verify the method exists
      const methodExists = paymentSettings.methods.some(m => m.id === id);
      if (!methodExists) {
        throw new Error('Payment method not found');
      }

      // Create a copy of the current settings
      const updatedSettings = { ...paymentSettings, defaultMethod: id };
      
      // Update metadata
      updatedSettings.updatedAt = new Date().toISOString();
      updatedSettings.updatedBy = {
        id: user.id,
        name: user.name
      };

      // Update in Firebase
      await updateData('', 'paymentSettings', updatedSettings);

      // Update local state
      setPaymentSettings(updatedSettings);

      // Add notification
      await addNotification({
        title: 'Default Payment Method Updated',
        message: `Default payment method has been updated`,
        type: 'system'
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      setError(error instanceof Error ? error.message : 'Failed to set default payment method');
      throw error;
    }
  };

  // Refresh payment settings
  const refreshPaymentSettings = async () => {
    return fetchPaymentSettings();
  };

  return (
    <PaymentContext.Provider value={{
      paymentSettings,
      getPaymentMethods,
      getActivePaymentMethods,
      getPaymentMethod,
      addPaymentMethod,
      updatePaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      loading,
      error,
      refreshPaymentSettings
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use the payment context
export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};
