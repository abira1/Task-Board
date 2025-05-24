import React, { useState, useEffect } from 'react';
import { XIcon, SaveIcon, Loader2Icon } from 'lucide-react';
import { useServices, Service, NewService } from '../contexts/ServiceContext';

interface ServiceFormProps {
  service?: Service | null;
  onClose: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ service, onClose }) => {
  const { addService, updateService, validateServiceName, services } = useServices();
  const [formData, setFormData] = useState<NewService>({
    name: '',
    description: '',
    defaultPrice: 0,
    category: '',
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Get unique categories for dropdown
  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        defaultPrice: service.defaultPrice,
        category: service.category || '',
        isActive: service.isActive
      });
    }
  }, [service]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    } else if (!validateServiceName(formData.name, service?.id)) {
      newErrors.name = 'A service with this name already exists';
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate price
    if (formData.defaultPrice < 0) {
      newErrors.defaultPrice = 'Price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (service) {
        // Update existing service
        await updateService(service.id, formData);
      } else {
        // Create new service
        await addService(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      // Error is handled by the context
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof NewService, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#f5f0e8]">
          <h2 className="text-xl font-medium text-[#3a3226]">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#7a7067] hover:text-[#3a3226] transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 bg-[#f5f0e8] rounded-lg border ${
                errors.name ? 'border-red-400' : 'border-[#f5f0e8]'
              } focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]`}
              placeholder="Enter service name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 bg-[#f5f0e8] rounded-lg border ${
                errors.description ? 'border-red-400' : 'border-[#f5f0e8]'
              } focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] resize-none`}
              placeholder="Enter service description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Default Price */}
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Default Price ($) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.defaultPrice}
              onChange={(e) => handleInputChange('defaultPrice', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 bg-[#f5f0e8] rounded-lg border ${
                errors.defaultPrice ? 'border-red-400' : 'border-[#f5f0e8]'
              } focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]`}
              placeholder="0.00"
            />
            {errors.defaultPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.defaultPrice}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Category
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="flex-1 px-4 py-3 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none"
              >
                <option value="">Select or enter category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
              placeholder="Or enter new category"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-[#d4a5a5] focus:ring-[#d4a5a5] border-[#d4a5a5] rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-[#3a3226]">
              Service is active and available for quotations
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#f5f0e8] text-[#3a3226] rounded-lg hover:bg-[#ebe6de] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {service ? 'Update Service' : 'Create Service'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
