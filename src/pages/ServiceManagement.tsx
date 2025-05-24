import React, { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { useServices, Service, NewService } from '../contexts/ServiceContext';
import { useAuth } from '../contexts/AuthContext';
import ServiceForm from '../components/ServiceForm';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ServiceManagement: React.FC = () => {
  const { services, activeServices, removeService, toggleServiceStatus, loading, error } = useServices();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-medium text-[#3a3226] mb-2">Access Restricted</h2>
          <p className="text-[#7a7067]">Only admin users can access Service Management.</p>
        </div>
      </div>
    );
  }

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && service.isActive) ||
                         (filterStatus === 'inactive' && !service.isActive);
    
    const matchesCategory = filterCategory === 'all' || 
                           service.category === filterCategory ||
                           (!service.category && filterCategory === 'uncategorized');
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  const handleAddService = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDeleteService = async () => {
    if (deleteConfirm) {
      try {
        await removeService(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      await toggleServiceStatus(service.id);
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingService(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4a5a5]"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226]">
              Service Management
            </h1>
            <p className="text-[#7a7067] mt-1">
              Manage services available for quotations
            </p>
          </div>
          <button
            onClick={handleAddService}
            className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Service
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7a7067]" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredServices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#7a7067] mb-4">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' 
                ? 'No services match your filters' 
                : 'No services found'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && (
              <button
                onClick={handleAddService}
                className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors"
              >
                Add Your First Service
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f0e8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f0e8]">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-[#f9f6f1]">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-[#3a3226]">
                          {service.name}
                        </div>
                        <div className="text-sm text-[#7a7067]">
                          {service.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f0e8] text-[#3a3226]">
                        {service.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#3a3226]">
                      ${service.defaultPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(service)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {service.isActive ? (
                          <>
                            <ToggleRightIcon className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeftIcon className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditService(service)}
                          className="text-[#7a7067] hover:text-[#3a3226] transition-colors"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(service)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <ServiceForm
          service={editingService}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmationDialog
          title="Delete Service"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteService}
          onCancel={() => setDeleteConfirm(null)}
          type="danger"
        />
      )}
    </div>
  );
};

export default ServiceManagement;
