import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { Lead } from './LeadContext';
import { clientDataSynchronizer } from '../services/ClientDataSynchronizer';

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

export interface Client {
  id: string;
  companyName: string;
  contactPersonName?: string;
  businessType: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  handledBy: {
    name: string;
    avatar: string;
  };
  leadId?: string; // Reference to the original lead if converted
  status: 'Active' | 'Inactive';
  notes?: string;
}

// Type for creating a new client
export type NewClient = Omit<Client, 'id' | 'createdAt'>;

interface ClientContextType {
  clients: Client[];
  addClient: (client: NewClient) => Promise<string | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<any>;
  convertLeadToClient: (lead: Lead) => Promise<string | null>;
  loading: boolean;
  error: string | null;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients on component mount
  useEffect(() => {
    const unsubscribe = fetchClients();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch clients from Firebase
  const fetchClients = () => {
    setLoading(true);
    setError(null);

    try {
      return fetchData<Client[]>(
        'clients',
        (data) => {
          if (data) {
            try {
              // Sort clients by createdAt (newest first)
              const sortedData = [...data].sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              });
              setClients(sortedData);
            } catch (sortError) {
              console.error('Error sorting clients:', sortError);
              setClients(data);
            }
          } else {
            setClients([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching clients:', err);
          setError('Failed to load clients. Please try again later.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up clients listener:', error);
      setError('Failed to connect to the database. Please check your connection.');
      setLoading(false);
      return () => {}; // Return empty function if setup fails
    }
  };

  // Add a new client
  const addClient = async (client: NewClient): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the client with additional metadata
      const newClient = {
        ...client,
        createdAt: new Date().toISOString(),
        createdBy: {
          id: user.id,
          name: user.name
        }
      };

      // Clean undefined values before saving to Firebase
      const cleanedClient = cleanUndefinedValues(newClient);

      // Add to Firebase
      const clientId = await addData('clients', cleanedClient);

      // Add notification
      await addNotification({
        title: 'New Client Added',
        message: `${client.companyName} has been added as a new client`,
        type: 'team'
      });

      // Refresh clients list
      await refreshClients();

      return clientId;
    } catch (error) {
      console.error('Error adding client:', error);
      setError(error instanceof Error ? error.message : 'Failed to add client');
      return null;
    }
  };

  // Update an existing client
  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      // Clean undefined values before saving to Firebase
      const cleanedData = cleanUndefinedValues(clientData);

      // Update client in Firebase
      await updateData('clients', id, cleanedData);

      // Update local state immediately for better UI responsiveness
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === id ? { ...client, ...clientData } : client
        )
      );

      // Add notification
      await addNotification({
        title: 'Client Updated',
        message: `Client information has been updated`,
        type: 'team'
      });

      // Synchronize client data with related documents in the background
      // This won't block the UI since we've made it non-blocking
      clientDataSynchronizer.synchronizeClientData(id, clientData)
        .catch(syncError => {
          console.error('Background synchronization error:', syncError);
        });
    } catch (error) {
      console.error('Error updating client:', error);
      setError(error instanceof Error ? error.message : 'Failed to update client');
      throw error;
    }
  };

  // Remove a client
  const removeClient = async (id: string) => {
    try {
      // Perform the deletion operation
      await removeData('clients', id);

      // Update local state
      setClients(prevClients => prevClients.filter(client => client.id !== id));

      // Add notification
      await addNotification({
        title: 'Client Removed',
        message: `A client has been removed from the system`,
        type: 'team'
      });

      return { success: true, message: 'Client deleted successfully' };
    } catch (error) {
      console.error('Error removing client:', error);
      throw error;
    }
  };

  // Convert a lead to a client
  const convertLeadToClient = async (lead: Lead): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create new client from lead data
      const newClient: NewClient = {
        companyName: lead.companyName,
        contactPersonName: lead.contactPersonName,
        businessType: lead.businessType,
        email: lead.email,
        phoneNumber: lead.phoneNumber,
        notes: lead.notes,
        leadId: lead.id,
        status: 'Active',
        handledBy: lead.handledBy,
        createdBy: {
          id: user.id,
          name: user.name
        }
      };

      // Add to Firebase
      const clientId = await addClient(newClient);

      // Update lead status to indicate conversion
      await updateData('leads', lead.id, {
        progress: 'Confirm',
        notes: lead.notes ? `${lead.notes}\n\nConverted to client on ${new Date().toLocaleDateString()}` : `Converted to client on ${new Date().toLocaleDateString()}`
      });

      // Add notification
      await addNotification({
        title: 'Lead Converted to Client',
        message: `${lead.companyName} has been converted from a lead to a client`,
        type: 'team'
      });

      return clientId;
    } catch (error) {
      console.error('Error converting lead to client:', error);
      setError(error instanceof Error ? error.message : 'Failed to convert lead to client');
      return null;
    }
  };

  // Refresh clients data
  const refreshClients = async () => {
    return fetchClients();
  };

  return (
    <ClientContext.Provider value={{
      clients,
      addClient,
      updateClient,
      removeClient,
      convertLeadToClient,
      loading,
      error,
      refreshClients
    }}>
      {children}
    </ClientContext.Provider>
  );
};

// Custom hook to use the client context
export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};
