import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultLeads } from '../firebase/initData';
import { useAuth } from './AuthContext';
import { database } from '../firebase/config';
import { ref, onDisconnect, serverTimestamp, onValue, set } from 'firebase/database';

export interface Lead {
  id: string;
  companyName: string;
  contactPersonName?: string;
  businessType: string;
  socialMedia?: string;
  contactInfo: string;
  progress: 'Untouched' | 'Knocked' | 'In Progress' | 'Confirm' | 'Canceled';
  handledBy: {
    name: string;
    avatar: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  notes?: string;
  location?: string;
  createdAt: string;
}

// Type for creating a new lead
export type NewLead = Omit<Lead, 'id' | 'createdAt'>;

interface LeadContextType {
  leads: Lead[];
  addLead: (lead: NewLead) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  removeLead: (id: string) => Promise<any>;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refreshLeads: () => Promise<void>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const { isAdmin, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Monitor connection status
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      setIsConnected(!!snap.val());

      if (!!snap.val() === true) {
        // We're connected (or reconnected)
        setError(null);
      } else {
        // We're disconnected
        setError("You appear to be offline. Some features may be limited.");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch leads from Firebase with improved error handling
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the updated fetchData function with error callback
      return fetchData<Lead[]>(
        'leads',
        (data) => {
          if (data) {
            try {
              // Sort leads by createdAt (newest first)
              const sortedData = [...data].sort((a, b) => {
                // Handle missing createdAt values safely
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              });
              setLeads(sortedData);
            } catch (sortError) {
              console.error('Error sorting leads:', sortError);
              // If sorting fails, still use the unsorted data
              setLeads(data);
            }
          } else {
            setLeads([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching leads:', err);
          setError('Failed to load leads. Please try again later.');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error in fetchLeads:', err);
      setError('Failed to load leads. Please try again later.');
      setLoading(false);
      // Return a no-op function as fallback
      return () => {};
    }
  };

  // Refresh leads function
  const refreshLeads = async () => {
    setLoading(true);
    try {
      // Just call fetchLeads and ignore the returned unsubscribe function
      // since we're not setting up a long-term listener here
      await fetchLeads();
    } catch (error) {
      console.error('Error refreshing leads:', error);
      setError('Failed to refresh leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch with proper cleanup
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initFetch = async () => {
      try {
        unsubscribe = await fetchLeads();
      } catch (error) {
        console.error("Error setting up leads subscription:", error);
      }
    };

    initFetch();

    // Cleanup function
    return () => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from leads:", error);
        }
      }
    };
  }, []);

  const addLead = async (lead: NewLead) => {
    try {
      // All users can add leads
      if (!user) {
        throw new Error('User not authenticated');
      }

      const timestamp = new Date().toISOString();
      const newLead = {
        ...lead,
        createdAt: timestamp,
        createdBy: {
          id: user.id,
          name: user.name
        }
      };

      await addData('leads', newLead);
    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  };

  const updateLead = async (id: string, lead: Partial<Lead>) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the current lead to check permissions
      const currentLeadData = leads.find(l => l.id === id);

      if (!currentLeadData) {
        throw new Error('Lead not found');
      }

      // Check if user is admin or the creator of the lead
      const isCreator = currentLeadData.createdBy?.id === user.id;

      if (!isAdmin() && !isCreator) {
        throw new Error('Permission denied: You can only edit leads you created');
      }

      await updateData('leads', id, lead);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  };

  const removeLead = async (id: string) => {
    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify admin permissions - strict check
      if (!isAdmin()) {
        throw new Error('Permission denied: Only administrators can remove leads');
      }

      // Check if lead exists before attempting to delete
      const leadExists = leads.some(lead => lead.id === id);
      if (!leadExists) {
        throw new Error('Lead not found: The requested lead does not exist');
      }

      // Perform the deletion operation
      await removeData('leads', id);

      // Update local state to reflect the deletion immediately
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));

      // Return success for proper handling
      return { success: true, message: 'Lead deleted successfully' };
    } catch (error) {
      console.error('Error removing lead:', error);
      // Re-throw the error for handling in the component
      throw error;
    }
  };

  return (
    <LeadContext.Provider value={{
      leads,
      addLead,
      updateLead,
      removeLead,
      loading,
      error,
      isConnected,
      refreshLeads
    }}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
