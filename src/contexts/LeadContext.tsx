import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultLeads } from '../firebase/initData';
import { useAuth } from './AuthContext';

export interface Lead {
  id: string;
  companyName: string;
  contactPersonName: string;
  businessType: string;
  socialMedia?: string;
  email: string;
  fullName: string;
  progress: 'In Progress' | 'Untouched' | 'Closed';
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
  removeLead: (id: string) => Promise<void>;
  loading: boolean;
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

  // Fetch leads from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Lead[]>('leads', (data) => {
      if (data) {
        // Sort leads by createdAt (newest first)
        const sortedData = [...data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLeads(sortedData);
      } else {
        setLeads([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
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
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Only admins can delete leads
      if (!isAdmin()) {
        throw new Error('Permission denied: Only administrators can remove leads');
      }

      await removeData('leads', id);
    } catch (error) {
      console.error('Error removing lead:', error);
      throw error;
    }
  };

  return (
    <LeadContext.Provider value={{
      leads,
      addLead,
      updateLead,
      removeLead,
      loading
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
