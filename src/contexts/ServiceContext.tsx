import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchData, addData, updateData, removeData, getDataOnce } from '../firebase/database';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export interface Service {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  updatedAt?: string;
  updatedBy?: {
    id: string;
    name: string;
  };
}

// Type for creating a new service
export type NewService = Omit<Service, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;

interface ServiceContextType {
  services: Service[];
  activeServices: Service[];
  getService: (id: string) => Promise<Service | null>;
  addService: (service: NewService) => Promise<string | null>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
  validateServiceName: (name: string, excludeId?: string) => boolean;
  loading: boolean;
  error: string | null;
  refreshServices: () => Promise<void>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Fetch services from Firebase
  const fetchServices = () => {
    fetchData<Service[]>(
      'services',
      (data) => {
        if (data) {
          // Sort services by name
          const sortedServices = data.sort((a, b) => a.name.localeCompare(b.name));
          setServices(sortedServices);
        } else {
          setServices([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching services:', error);
        setError('Failed to fetch services');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Get active services only
  const activeServices = services.filter(service => service.isActive);

  // Get a single service by ID
  const getService = async (id: string): Promise<Service | null> => {
    try {
      const service = await getDataOnce<Service>(`services/${id}`);
      if (service) {
        return { ...service, id };
      }
      return null;
    } catch (error) {
      console.error('Error getting service:', error);
      setError(error instanceof Error ? error.message : 'Failed to get service');
      return null;
    }
  };

  // Validate service name for uniqueness
  const validateServiceName = (name: string, excludeId?: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return !services.some(service => 
      service.name.toLowerCase() === trimmedName && service.id !== excludeId
    );
  };

  // Add a new service
  const addService = async (service: NewService): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate service name
      if (!validateServiceName(service.name)) {
        throw new Error('A service with this name already exists');
      }

      // Validate required fields
      if (!service.name.trim()) {
        throw new Error('Service name is required');
      }
      if (service.defaultPrice < 0) {
        throw new Error('Default price must be a positive number');
      }

      // Create the service with additional metadata
      const newService = {
        ...service,
        name: service.name.trim(),
        description: service.description.trim(),
        createdAt: new Date().toISOString(),
        createdBy: {
          id: user.id,
          name: user.name
        }
      };

      // Add to Firebase
      const serviceId = await addData('services', newService);

      // Add notification
      await addNotification({
        title: 'Service Created',
        message: `Service "${service.name}" has been created`,
        type: 'system'
      });

      return serviceId;
    } catch (error) {
      console.error('Error adding service:', error);
      setError(error instanceof Error ? error.message : 'Failed to add service');
      return null;
    }
  };

  // Update an existing service
  const updateService = async (id: string, serviceUpdate: Partial<Service>): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate service name if it's being updated
      if (serviceUpdate.name && !validateServiceName(serviceUpdate.name, id)) {
        throw new Error('A service with this name already exists');
      }

      // Prepare update data
      const updateData = {
        ...serviceUpdate,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: user.id,
          name: user.name
        }
      };

      // Clean up the data (remove undefined values)
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      // Update in Firebase
      await updateData('services', id, updateData);

      // Add notification
      await addNotification({
        title: 'Service Updated',
        message: `Service has been updated`,
        type: 'system'
      });
    } catch (error) {
      console.error('Error updating service:', error);
      setError(error instanceof Error ? error.message : 'Failed to update service');
      throw error;
    }
  };

  // Remove a service
  const removeService = async (id: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const service = services.find(s => s.id === id);
      if (!service) {
        throw new Error('Service not found');
      }

      // Remove from Firebase
      await removeData('services', id);

      // Add notification
      await addNotification({
        title: 'Service Deleted',
        message: `Service "${service.name}" has been deleted`,
        type: 'system'
      });
    } catch (error) {
      console.error('Error removing service:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove service');
      throw error;
    }
  };

  // Toggle service active status
  const toggleServiceStatus = async (id: string): Promise<void> => {
    try {
      const service = services.find(s => s.id === id);
      if (!service) {
        throw new Error('Service not found');
      }

      await updateService(id, { isActive: !service.isActive });

      // Add notification
      await addNotification({
        title: 'Service Status Updated',
        message: `Service "${service.name}" has been ${!service.isActive ? 'activated' : 'deactivated'}`,
        type: 'system'
      });
    } catch (error) {
      console.error('Error toggling service status:', error);
      throw error;
    }
  };

  // Refresh services data
  const refreshServices = async (): Promise<void> => {
    setLoading(true);
    fetchServices();
  };

  const value: ServiceContextType = {
    services,
    activeServices,
    getService,
    addService,
    updateService,
    removeService,
    toggleServiceStatus,
    validateServiceName,
    loading,
    error,
    refreshServices
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};
