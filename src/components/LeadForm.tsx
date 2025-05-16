import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Lead, NewLead } from '../contexts/LeadContext';

interface LeadFormProps {
  onClose: () => void;
  onSubmit: (lead: NewLead) => Promise<void>;
  initialLead?: Lead;
  isEdit?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({
  onClose,
  onSubmit,
  initialLead,
  isEdit = false
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<NewLead, 'handledBy'>>({
    companyName: initialLead?.companyName || '',
    contactPersonName: initialLead?.contactPersonName || '',
    businessType: initialLead?.businessType || '',
    socialMedia: initialLead?.socialMedia || '',
    contactInfo: initialLead?.contactInfo || '',
    progress: initialLead?.progress || 'Untouched',
    notes: initialLead?.notes || '',
    location: initialLead?.location || ''
  });

  const [errors, setErrors] = useState({
    companyName: '',
    contactInfo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      companyName: '',
      contactInfo: ''
    };

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
      valid = false;
    }

    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Get current user as handler
      const handledBy = {
        name: user?.name || 'Unknown User',
        avatar: user?.avatar || ''
      };

      // Create the complete lead object
      const leadData: NewLead = {
        ...formData,
        handledBy
      };

      await onSubmit(leadData);

      // Show notification
      await addNotification({
        title: isEdit ? 'Lead Updated' : 'New Lead Added',
        message: isEdit
          ? `${formData.companyName} lead has been updated`
          : `${formData.companyName} has been added as a new lead`,
        type: 'task'
      });

      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);

      await addNotification({
        title: 'Error',
        message: `Failed to ${isEdit ? 'update' : 'add'} lead. Please try again.`,
        type: 'system'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[480px] md:max-w-[800px] md:rounded-xl flex flex-col">
        {/* Modal Header with sticky positioning */}
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-[#f5f0e8] flex justify-between items-center z-20 shadow-sm">
          <h2 className="font-['Caveat',_cursive] text-xl md:text-2xl text-[#3a3226]">
            {isEdit ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226] transition-colors"
            aria-label="Close form"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content with scrollable area */}
        <div className="flex-grow overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Left Column */}
              <div>
                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.companyName ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`}
                    placeholder="Enter Company Name"
                  />
                  {errors.companyName && <p className="text-[#d4a5a5] text-xs mt-1">{errors.companyName}</p>}
                </div>

                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Business Type / Industry
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none"
                  >
                    <option value="">Select Business Type</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Salon & Beauty">Salon & Beauty</option>
                    <option value="Creative Agency">Creative Agency</option>
                    <option value="Home Decor Store">Home Decor Store</option>
                    <option value="E-commerce Startup">E-commerce Startup</option>
                    <option value="Real Estate Agency">Real Estate Agency</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Contact Info
                  </label>
                  <input
                    type="text"
                    name="contactInfo"
                    value={formData.contactInfo}
                    onChange={handleChange}
                    className={`bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.contactInfo ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`}
                    placeholder="Enter email or phone number"
                  />
                  {errors.contactInfo && <p className="text-[#d4a5a5] text-xs mt-1">{errors.contactInfo}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Contact Person Name <span className="text-[#7a7067] text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName || ''}
                    onChange={handleChange}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    placeholder="Enter Name"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Social Media <span className="text-[#7a7067] text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="socialMedia"
                    value={formData.socialMedia || ''}
                    onChange={handleChange}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    placeholder="Enter Social Media Link"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Location <span className="text-[#7a7067] text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    placeholder="City, State, Country"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Progress Status
                  </label>
                  <select
                    name="progress"
                    value={formData.progress}
                    onChange={handleChange}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none"
                  >
                    <option value="Untouched">Untouched</option>
                    <option value="Knocked">Knocked</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Confirm">Confirm</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Field - Full Width */}
            <div className="mb-6">
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Notes <span className="text-[#7a7067] text-xs">(optional)</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[120px]"
                placeholder="Add any additional notes about this lead..."
              />
            </div>

            {/* Form Footer with sticky positioning */}
            <div className="sticky bottom-0 bg-white pt-5 pb-2 border-t border-[#f5f0e8] flex flex-col sm:flex-row gap-3 sm:justify-end z-20 shadow-md">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg flex items-center justify-center w-full sm:w-auto order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {isEdit ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  isEdit ? 'Save Changes' : 'Add Lead'
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
