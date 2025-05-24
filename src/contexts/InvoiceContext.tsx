import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData, getDataOnce } from '../firebase/database';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { Client } from './ClientContext';
import { Quotation, QuotationItem } from './QuotationContext';

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

export interface Invoice {
  id: string;
  clientId: string;
  quotationId?: string; // Reference to original quotation if converted
  invoiceNumber: string;
  date?: string;
  invoiceDate?: string; // For backward compatibility
  dueDate: string;
  items: QuotationItem[]; // Reuse the same structure from quotations
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  total: number;
  notes?: string;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  paymentMethod?: string;
  paymentDate?: string;
  paymentHistory?: {
    date: string;
    amount: number;
    method: string;
    notes?: string;
    recordedBy: {
      id: string;
      name: string;
    };
  }[];
  paymentStatusHistory?: {
    date: string;
    previousStatus: string;
    newStatus: string;
    changedBy: {
      id: string;
      name: string;
    };
    notes?: string;
  }[];
  createdAt?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  clientDetails?: Client; // For UI display, not stored in Firebase
}

// Type for creating a new invoice
export type NewInvoice = Omit<Invoice, 'id' | 'createdAt' | 'clientDetails'>;

interface InvoiceContextType {
  invoices: Invoice[];
  getInvoice: (id: string) => Promise<Invoice | null>;
  getClientInvoices: (clientId: string) => Promise<Invoice[]>;
  addInvoice: (invoice: NewInvoice) => Promise<string | null>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  removeInvoice: (id: string) => Promise<any>;
  convertQuotationToInvoice: (quotation: Quotation) => Promise<string | null>;
  generateInvoiceNumber: () => Promise<string>;
  updatePaymentStatus: (id: string, status: Invoice['paymentStatus'], notes?: string) => Promise<void>;
  addPaymentRecord: (id: string, amount: number, method: string, notes?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshInvoices: () => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices on component mount
  useEffect(() => {
    const unsubscribe = fetchInvoices();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch invoices from Firebase
  const fetchInvoices = () => {
    setLoading(true);
    setError(null);

    try {
      return fetchData<Invoice[]>(
        'invoices',
        (data) => {
          if (data) {
            try {
              // Sort invoices by createdAt (newest first)
              const sortedData = [...data].sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              });
              setInvoices(sortedData);
            } catch (sortError) {
              console.error('Error sorting invoices:', sortError);
              setInvoices(data);
            }
          } else {
            setInvoices([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching invoices:', err);
          setError('Failed to load invoices. Please try again later.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up invoices listener:', error);
      setError('Failed to connect to the database. Please check your connection.');
      setLoading(false);
      return () => {}; // Return empty function if setup fails
    }
  };

  // Get a single invoice by ID
  const getInvoice = async (id: string): Promise<Invoice | null> => {
    try {
      console.log(`Getting invoice with ID: ${id}`);
      const invoice = await getDataOnce<Invoice>(`invoices/${id}`);

      if (invoice) {
        console.log('Invoice found:', invoice);

        // Fetch client details for the invoice if clientId exists
        if (invoice.clientId) {
          try {
            const client = await getDataOnce<Client>(`clients/${invoice.clientId}`);
            if (client) {
              console.log('Client details found:', client);
              return { ...invoice, id, clientDetails: { ...client, id: invoice.clientId } };
            } else {
              console.warn(`Client not found for clientId: ${invoice.clientId}`);
            }
          } catch (clientError) {
            console.error('Error fetching client details:', clientError);
            // Continue without client details rather than failing completely
          }
        }

        return { ...invoice, id };
      } else {
        console.log(`Invoice not found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error('Error getting invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to get invoice');
      return null;
    }
  };

  // Get all invoices for a specific client
  const getClientInvoices = async (clientId: string): Promise<Invoice[]> => {
    try {
      // Filter invoices by clientId
      return invoices.filter(invoice => invoice.clientId === clientId);
    } catch (error) {
      console.error('Error getting client invoices:', error);
      setError(error instanceof Error ? error.message : 'Failed to get client invoices');
      return [];
    }
  };

  // Generate a new invoice number
  const generateInvoiceNumber = async (): Promise<string> => {
    try {
      // Get the current year
      const currentYear = new Date().getFullYear();

      // Count existing invoices for this year
      const yearPrefix = `INV-${currentYear}-`;
      const yearInvoices = invoices.filter(i => i.invoiceNumber.startsWith(yearPrefix));

      // Generate next number
      const nextNumber = yearInvoices.length + 1;

      // Format with leading zeros (e.g., INV-2024-0001)
      return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number if something goes wrong
      return `INV-${new Date().getTime()}`;
    }
  };

  // Add a new invoice
  const addInvoice = async (invoice: NewInvoice): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Handle date field compatibility
      const invoiceWithDates = {
        ...invoice,
        // If date is provided but not invoiceDate, use date for invoiceDate
        invoiceDate: invoice.invoiceDate || invoice.date,
        // Ensure date is set if only invoiceDate is provided
        date: invoice.date || invoice.invoiceDate
      };

      // Create the invoice with additional metadata
      const newInvoice = {
        ...invoiceWithDates,
        createdAt: new Date().toISOString(),
        createdBy: {
          id: user.id,
          name: user.name
        },
        // Ensure required fields have defaults
        discountType: invoiceWithDates.discountType || 'percentage',
        discountValue: invoiceWithDates.discountValue || 0,
        discountAmount: invoiceWithDates.discountAmount || 0
      };

      // Clean undefined values before saving to Firebase
      const cleanedInvoice = cleanUndefinedValues(newInvoice);

      // Add to Firebase
      const invoiceId = await addData('invoices', cleanedInvoice);

      // Add notification
      await addNotification({
        title: 'New Invoice Created',
        message: `Invoice ${invoice.invoiceNumber} has been created`,
        type: 'team'
      });

      // Refresh invoices list
      await refreshInvoices();

      return invoiceId;
    } catch (error) {
      console.error('Error adding invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to add invoice');
      return null;
    }
  };

  // Update an existing invoice
  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    try {
      // Remove clientDetails if present (not stored in Firebase)
      const { clientDetails, ...dataToUpdate } = invoiceData;

      // Clean undefined values before saving to Firebase
      const cleanedData = cleanUndefinedValues(dataToUpdate);

      await updateData('invoices', id, cleanedData);

      // Update local state
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === id ? { ...invoice, ...dataToUpdate } : invoice
        )
      );

      // Add notification
      await addNotification({
        title: 'Invoice Updated',
        message: `Invoice has been updated`,
        type: 'team'
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to update invoice');
      throw error;
    }
  };

  // Remove an invoice
  const removeInvoice = async (id: string) => {
    try {
      // Perform the deletion operation
      await removeData('invoices', id);

      // Update local state
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== id));

      // Add notification
      await addNotification({
        title: 'Invoice Removed',
        message: `An invoice has been removed from the system`,
        type: 'team'
      });

      return { success: true, message: 'Invoice deleted successfully' };
    } catch (error) {
      console.error('Error removing invoice:', error);
      throw error;
    }
  };

  // Convert a quotation to an invoice
  const convertQuotationToInvoice = async (quotation: Quotation): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate a new invoice number
      const invoiceNumber = await generateInvoiceNumber();

      // Create new invoice from quotation data
      const newInvoice: NewInvoice = {
        clientId: quotation.clientId,
        quotationId: quotation.id,
        invoiceNumber,
        date: new Date().toISOString().split('T')[0], // Today's date
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        items: quotation.items,
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue,
        discountAmount: quotation.discountAmount,
        total: quotation.total,
        notes: quotation.notes,
        paymentStatus: 'Unpaid'
      };

      // Add to Firebase
      const invoiceId = await addInvoice(newInvoice);

      // Update quotation status to 'Accepted'
      await updateData('quotations', quotation.id, { status: 'Accepted' });

      return invoiceId;
    } catch (error) {
      console.error('Error converting quotation to invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to convert quotation to invoice');
      return null;
    }
  };

  // Update payment status (admin or creator)
  const updatePaymentStatus = async (id: string, status: Invoice['paymentStatus'], notes?: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Check if user is admin or creator
      const isAdmin = user.role === 'admin';
      const isCreator = invoice.createdBy?.id === user.id;

      if (!isAdmin && !isCreator) {
        throw new Error('You can only update payment status for invoices you created or if you are an administrator');
      }

      // Create payment status change record
      const statusChangeRecord: any = {
        date: new Date().toISOString(),
        previousStatus: invoice.paymentStatus,
        newStatus: status,
        changedBy: {
          id: user.id,
          name: user.name
        }
      };

      // Only include notes if it's provided and not undefined
      if (notes !== undefined && notes !== null) {
        statusChangeRecord.notes = notes;
      }

      // Add to payment status history
      const currentStatusHistory = invoice.paymentStatusHistory || [];
      const updatedStatusHistory = [...currentStatusHistory, statusChangeRecord];

      const updateData: Partial<Invoice> = {
        paymentStatus: status,
        paymentDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : invoice.paymentDate,
        paymentStatusHistory: updatedStatusHistory
      };

      await updateInvoice(id, updateData);

      // Add notification
      await addNotification({
        title: 'Payment Status Updated',
        message: `Invoice ${invoice.invoiceNumber} payment status changed to ${status} by ${user.name}`,
        type: 'team'
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update payment status');
      throw error;
    }
  };

  // Add payment record (admin only)
  const addPaymentRecord = async (id: string, amount: number, method: string, notes?: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        throw new Error('Only admin users can add payment records');
      }

      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const paymentRecord: any = {
        date: new Date().toISOString().split('T')[0],
        amount,
        method,
        recordedBy: {
          id: user.id,
          name: user.name
        }
      };

      // Only include notes if it's provided and not undefined
      if (notes !== undefined && notes !== null) {
        paymentRecord.notes = notes;
      }

      const currentHistory = invoice.paymentHistory || [];
      const updatedHistory = [...currentHistory, paymentRecord];

      // Calculate total paid amount
      const totalPaid = updatedHistory.reduce((sum, record) => sum + record.amount, 0);

      // Determine new payment status
      let newStatus: Invoice['paymentStatus'];
      if (totalPaid >= invoice.total) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partially Paid';
      } else {
        newStatus = 'Unpaid';
      }

      const updateData: Partial<Invoice> = {
        paymentHistory: updatedHistory,
        paymentStatus: newStatus,
        paymentDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : invoice.paymentDate,
        paymentMethod: method
      };

      await updateInvoice(id, updateData);

      // Add notification
      await addNotification({
        title: 'Payment Recorded',
        message: `Payment of $${amount.toFixed(2)} recorded for Invoice ${invoice.invoiceNumber}`,
        type: 'team'
      });
    } catch (error) {
      console.error('Error adding payment record:', error);
      setError(error instanceof Error ? error.message : 'Failed to add payment record');
      throw error;
    }
  };

  // Refresh invoices data with improved error handling
  const refreshInvoices = async (): Promise<void> => {
    try {
      // Create a promise that resolves when fetchInvoices completes
      return new Promise((resolve, reject) => {
        try {
          // Set a timeout to ensure the promise resolves even if fetchInvoices hangs
          const timeoutId = setTimeout(() => {
            console.warn('Invoice refresh operation timed out after 10 seconds');
            resolve(); // Resolve anyway to prevent UI from hanging
          }, 10000);

          // Set up a temporary listener to know when data is loaded
          const unsubscribe = fetchData<any>(
            'invoices',
            (_data) => {
              clearTimeout(timeoutId);
              unsubscribe();
              resolve();
            },
            (error) => {
              clearTimeout(timeoutId);
              unsubscribe();
              console.error('Error refreshing invoices:', error);
              reject(error);
            }
          );

          // Also call fetchInvoices to update the context state
          fetchInvoices();
        } catch (error) {
          console.error('Error setting up invoice refresh:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in refreshInvoices:', error);
      return Promise.resolve(); // Ensure we always return a resolved promise
    }
  };

  return (
    <InvoiceContext.Provider value={{
      invoices,
      getInvoice,
      getClientInvoices,
      addInvoice,
      updateInvoice,
      removeInvoice,
      convertQuotationToInvoice,
      generateInvoiceNumber,
      updatePaymentStatus,
      addPaymentRecord,
      loading,
      error,
      refreshInvoices
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

// Custom hook to use the invoice context
export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};
