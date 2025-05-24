import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData, getDataOnce } from '../firebase/database';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { Client } from './ClientContext';

// Utility function to remove undefined values from objects before Firebase operations
const cleanUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }

  return obj;
};

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Quotation {
  id: string;
  clientId: string;
  quotationNumber: string;
  date: string;
  dueDate: string;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  clientDetails?: Client; // For UI display, not stored in Firebase
}

// Type for creating a new quotation
export type NewQuotation = Omit<Quotation, 'id' | 'createdAt' | 'clientDetails'>;

interface QuotationContextType {
  quotations: Quotation[];
  getQuotation: (id: string) => Promise<Quotation | null>;
  getClientQuotations: (clientId: string) => Promise<Quotation[]>;
  addQuotation: (quotation: NewQuotation) => Promise<string | null>;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => Promise<void>;
  removeQuotation: (id: string) => Promise<any>;
  generateQuotationNumber: () => Promise<string>;
  calculateQuotation: (items: QuotationItem[], taxRate: number, discountType: 'percentage' | 'fixed', discountValue: number) => {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
  refreshQuotations: () => Promise<void>;
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export const QuotationProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotations on component mount
  useEffect(() => {
    const unsubscribe = fetchQuotations();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch quotations from Firebase
  const fetchQuotations = () => {
    setLoading(true);
    setError(null);

    try {
      return fetchData<Quotation[]>(
        'quotations',
        (data) => {
          if (data) {
            try {
              // Sort quotations by createdAt (newest first)
              const sortedData = [...data].sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              });
              setQuotations(sortedData);
            } catch (sortError) {
              console.error('Error sorting quotations:', sortError);
              setQuotations(data);
            }
          } else {
            setQuotations([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching quotations:', err);
          setError('Failed to load quotations. Please try again later.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up quotations listener:', error);
      setError('Failed to connect to the database. Please check your connection.');
      setLoading(false);
      return () => {}; // Return empty function if setup fails
    }
  };

  // Get a single quotation by ID
  const getQuotation = async (id: string): Promise<Quotation | null> => {
    try {
      console.log(`Getting quotation with ID: ${id}`);
      const quotation = await getDataOnce<Quotation>(`quotations/${id}`);

      if (quotation) {
        console.log('Quotation found:', quotation);

        // Fetch client details for the quotation if clientId exists
        if (quotation.clientId) {
          try {
            const client = await getDataOnce<Client>(`clients/${quotation.clientId}`);
            if (client) {
              console.log('Client details found:', client);
              return { ...quotation, id, clientDetails: { ...client, id: quotation.clientId } };
            } else {
              console.warn(`Client not found for clientId: ${quotation.clientId}`);
            }
          } catch (clientError) {
            console.error('Error fetching client details:', clientError);
            // Continue without client details rather than failing completely
          }
        }

        return { ...quotation, id };
      } else {
        console.log(`Quotation not found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error('Error getting quotation:', error);
      setError(error instanceof Error ? error.message : 'Failed to get quotation');
      return null;
    }
  };

  // Get all quotations for a specific client
  const getClientQuotations = async (clientId: string): Promise<Quotation[]> => {
    try {
      // Filter quotations by clientId
      return quotations.filter(quotation => quotation.clientId === clientId);
    } catch (error) {
      console.error('Error getting client quotations:', error);
      setError(error instanceof Error ? error.message : 'Failed to get client quotations');
      return [];
    }
  };

  // Generate a new quotation number
  const generateQuotationNumber = async (): Promise<string> => {
    try {
      // Get the current year
      const currentYear = new Date().getFullYear();

      // Count existing quotations for this year
      const yearPrefix = `QT-${currentYear}-`;
      const yearQuotations = quotations.filter(q => q.quotationNumber.startsWith(yearPrefix));

      // Generate next number
      const nextNumber = yearQuotations.length + 1;

      // Format with leading zeros (e.g., QT-2024-0001)
      return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating quotation number:', error);
      // Fallback to timestamp-based number if something goes wrong
      return `QT-${new Date().getTime()}`;
    }
  };

  // Calculate quotation totals
  const calculateQuotation = (
    items: QuotationItem[],
    taxRate: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ) => {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    // Calculate tax on discounted amount
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);

    // Calculate total
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    };
  };

  // Add a new quotation
  const addQuotation = async (quotation: NewQuotation): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the quotation with additional metadata
      const newQuotation = {
        ...quotation,
        createdAt: new Date().toISOString(),
        createdBy: {
          id: user.id,
          name: user.name
        }
      };

      // Clean undefined values before saving to Firebase
      const cleanedQuotation = cleanUndefinedValues(newQuotation);

      // Add to Firebase
      const quotationId = await addData('quotations', cleanedQuotation);

      // Add notification
      await addNotification({
        title: 'New Quotation Created',
        message: `Quotation ${quotation.quotationNumber} has been created`,
        type: 'team'
      });

      // Refresh quotations list
      await refreshQuotations();

      return quotationId;
    } catch (error) {
      console.error('Error adding quotation:', error);
      setError(error instanceof Error ? error.message : 'Failed to add quotation');
      return null;
    }
  };

  // Update an existing quotation
  const updateQuotation = async (id: string, quotationData: Partial<Quotation>) => {
    try {
      // Remove clientDetails if present (not stored in Firebase)
      const { clientDetails, ...dataToUpdate } = quotationData;

      // Clean undefined values before saving to Firebase
      const cleanedData = cleanUndefinedValues(dataToUpdate);

      await updateData('quotations', id, cleanedData);

      // Update local state
      setQuotations(prevQuotations =>
        prevQuotations.map(quotation =>
          quotation.id === id ? { ...quotation, ...dataToUpdate } : quotation
        )
      );

      // Add notification
      await addNotification({
        title: 'Quotation Updated',
        message: `Quotation has been updated`,
        type: 'team'
      });
    } catch (error) {
      console.error('Error updating quotation:', error);
      setError(error instanceof Error ? error.message : 'Failed to update quotation');
      throw error;
    }
  };

  // Remove a quotation
  const removeQuotation = async (id: string) => {
    try {
      // Perform the deletion operation
      await removeData('quotations', id);

      // Update local state
      setQuotations(prevQuotations => prevQuotations.filter(quotation => quotation.id !== id));

      // Add notification
      await addNotification({
        title: 'Quotation Removed',
        message: `A quotation has been removed from the system`,
        type: 'team'
      });

      return { success: true, message: 'Quotation deleted successfully' };
    } catch (error) {
      console.error('Error removing quotation:', error);
      throw error;
    }
  };

  // Refresh quotations data with improved error handling
  const refreshQuotations = async (): Promise<void> => {
    try {
      // Create a promise that resolves when fetchQuotations completes
      return new Promise((resolve, reject) => {
        try {
          // Set a timeout to ensure the promise resolves even if fetchQuotations hangs
          const timeoutId = setTimeout(() => {
            console.warn('Quotation refresh operation timed out after 10 seconds');
            resolve(); // Resolve anyway to prevent UI from hanging
          }, 10000);

          // Set up a temporary listener to know when data is loaded
          const unsubscribe = fetchData<any>(
            'quotations',
            (_data) => {
              clearTimeout(timeoutId);
              unsubscribe();
              resolve();
            },
            (error) => {
              clearTimeout(timeoutId);
              unsubscribe();
              console.error('Error refreshing quotations:', error);
              reject(error);
            }
          );

          // Also call fetchQuotations to update the context state
          fetchQuotations();
        } catch (error) {
          console.error('Error setting up quotation refresh:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in refreshQuotations:', error);
      return Promise.resolve(); // Ensure we always return a resolved promise
    }
  };

  return (
    <QuotationContext.Provider value={{
      quotations,
      getQuotation,
      getClientQuotations,
      addQuotation,
      updateQuotation,
      removeQuotation,
      generateQuotationNumber,
      calculateQuotation,
      loading,
      error,
      refreshQuotations
    }}>
      {children}
    </QuotationContext.Provider>
  );
};

// Custom hook to use the quotation context
export const useQuotations = () => {
  const context = useContext(QuotationContext);
  if (context === undefined) {
    throw new Error('useQuotations must be used within a QuotationProvider');
  }
  return context;
};
