import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultLeads } from '../firebase/initData';
import { useAuth } from './AuthContext';
import { database } from '../firebase/config';
import { ref, onDisconnect, serverTimestamp, onValue, set } from 'firebase/database';
import { standardizeContactInfo } from '../utils/contactUtils';

export interface Lead {
  id: string;
  companyName: string;
  contactPersonName?: string;
  businessType: string;
  socialMedia?: string;
  email?: string;
  phoneNumber?: string;
  contactInfo?: string; // Kept for backward compatibility with existing data
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
  updateLeadProgress: (id: string, progress: Lead['progress']) => Promise<void>;
  removeLead: (id: string) => Promise<any>;
  checkDuplicateLead: (email?: string, phoneNumber?: string, excludeLeadId?: string) => Lead | null;
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

  // Check if a lead with the same email or phone number already exists
  const checkDuplicateLead = (email?: string, phoneNumber?: string, excludeLeadId?: string): Lead | null => {
    // If both email and phone are empty, no need to check
    if (!email && !phoneNumber) return null;

    // Standardize inputs
    const standardizedEmail = email ? email.toLowerCase().trim() : '';
    const standardizedPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';

    return leads.find(lead => {
      // Skip the lead being edited (if provided)
      if (excludeLeadId && lead.id === excludeLeadId) return false;

      // For backward compatibility, check the contactInfo field as well
      const leadEmail = lead.email ? lead.email.toLowerCase().trim() : '';
      const leadPhone = lead.phoneNumber ? lead.phoneNumber.replace(/\D/g, '') : '';
      const leadContactInfo = lead.contactInfo ? standardizeContactInfo(lead.contactInfo) : '';

      // Check if either email or phone matches
      if (standardizedEmail && leadEmail && standardizedEmail === leadEmail) {
        return true;
      }

      if (standardizedPhone && leadPhone && standardizedPhone === leadPhone) {
        return true;
      }

      // Backward compatibility check with contactInfo field
      if (lead.contactInfo) {
        // If contactInfo looks like an email and we're checking an email
        if (standardizedEmail && leadContactInfo.includes('@') &&
            leadContactInfo === standardizedEmail) {
          return true;
        }

        // If contactInfo looks like a phone number and we're checking a phone
        if (standardizedPhone && !leadContactInfo.includes('@') &&
            leadContactInfo.replace(/\D/g, '') === standardizedPhone) {
          return true;
        }
      }

      return false;
    }) || null;
  };

  const addLead = async (lead: NewLead) => {
    try {
      // All users can add leads
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check for duplicates before adding
      const duplicate = checkDuplicateLead(lead.email, lead.phoneNumber);
      if (duplicate) {
        const fieldType =
          (lead.email && duplicate.email?.toLowerCase() === lead.email.toLowerCase()) ? 'email' : 'phone number';
        throw new Error(`Duplicate lead: A lead with this ${fieldType} already exists (${duplicate.companyName})`);
      }

      // For backward compatibility, also set contactInfo field
      let contactInfoValue = '';
      if (lead.email) {
        contactInfoValue = lead.email;
      } else if (lead.phoneNumber) {
        contactInfoValue = lead.phoneNumber;
      }

      const timestamp = new Date().toISOString();
      const newLead = {
        ...lead,
        contactInfo: contactInfoValue, // Set for backward compatibility
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

  const updateLeadProgress = async (id: string, progress: Lead['progress']) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the current lead
      const currentLeadData = leads.find(l => l.id === id);

      if (!currentLeadData) {
        throw new Error('Lead not found');
      }

      // Any authenticated user can update lead progress
      // Update the handledBy field to reflect who made the progress change
      const updatedHandledBy = {
        name: user.name || 'Unknown User',
        avatar: user.avatar || ''
      };

      const updatePayload = {
        progress,
        handledBy: updatedHandledBy
      };

      await updateData('leads', id, updatePayload);
    } catch (error) {
      console.error('Error updating lead progress:', error);
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

      // Check for duplicates if email or phone is being updated
      const isEmailChanged = lead.email !== undefined && lead.email !== currentLeadData.email;
      const isPhoneChanged = lead.phoneNumber !== undefined && lead.phoneNumber !== currentLeadData.phoneNumber;

      if (isEmailChanged || isPhoneChanged) {
        // Get the values to check (use current values for fields not being updated)
        const emailToCheck = isEmailChanged ? lead.email : currentLeadData.email;
        const phoneToCheck = isPhoneChanged ? lead.phoneNumber : currentLeadData.phoneNumber;

        const duplicate = checkDuplicateLead(emailToCheck, phoneToCheck, id);
        if (duplicate) {
          const fieldType =
            (isEmailChanged && duplicate.email?.toLowerCase() === emailToCheck?.toLowerCase()) ? 'email' : 'phone number';
          throw new Error(`Duplicate lead: A lead with this ${fieldType} already exists (${duplicate.companyName})`);
        }
      }

      // For backward compatibility, also update contactInfo field
      let updatedLead = { ...lead };

      if (isEmailChanged || isPhoneChanged) {
        // Determine the new contactInfo value
        let contactInfoValue = '';

        // Use the new values if provided, otherwise use the existing ones
        const newEmail = lead.email !== undefined ? lead.email : currentLeadData.email;
        const newPhone = lead.phoneNumber !== undefined ? lead.phoneNumber : currentLeadData.phoneNumber;

        if (newEmail) {
          contactInfoValue = newEmail;
        } else if (newPhone) {
          contactInfoValue = newPhone;
        }

        updatedLead.contactInfo = contactInfoValue;
      }

      await updateData('leads', id, updatedLead);
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
      updateLeadProgress,
      removeLead,
      checkDuplicateLead,
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
