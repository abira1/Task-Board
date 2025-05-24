import React, { useState, useEffect } from 'react';
import { XIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Client, NewClient } from '../contexts/ClientContext';
import { Lead } from '../contexts/LeadContext';
import { fetchData } from '../firebase/database';

interface ClientFormProps {
  onClose: () => void;
  onSubmit: (client: NewClient) => Promise<string | null>;
  initialClient?: Client;
  initialLead?: Lead | null;
  isEdit?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

const ClientForm: React.FC<ClientFormProps> = ({
  onClose,
  onSubmit,
  initialClient,
  initialLead,
  isEdit = false
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);

  const [formData, setFormData] = useState<Omit<NewClient, 'handledBy' | 'createdBy'>>({
    companyName: initialClient?.companyName || initialLead?.companyName || '',
    contactPersonName: initialClient?.contactPersonName || initialLead?.contactPersonName || '',
    businessType: initialClient?.businessType || initialLead?.businessType || '',
    email: initialClient?.email || initialLead?.email || '',
    phoneNumber: initialClient?.phoneNumber || initialLead?.phoneNumber || '',
    address: initialClient?.address || '',
    status: initialClient?.status || 'Active',
    notes: initialClient?.notes || initialLead?.notes || '',
    leadId: initialClient?.leadId || initialLead?.id || undefined
  });

  const [selectedHandledBy, setSelectedHandledBy] = useState<string>(
    initialClient?.handledBy.name || initialLead?.handledBy.name || user?.name || ''
  );

  const [errors, setErrors] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    contactFields: '' // Error for when both email and phone are empty
  });

  // Fetch team members for assignee dropdown
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoadingTeamMembers(true);
      try {
        await fetchData<User[]>(
          'users',
          (data) => {
            if (data) {
              // Filter to only include approved users
              const approvedUsers = data.filter(user => user.approvalStatus === 'approved');
              setTeamMembers(approvedUsers);
            } else {
              setTeamMembers([]);
            }
            setLoadingTeamMembers(false);
          },
          (err) => {
            console.error('Error fetching team members:', err);
            setLoadingTeamMembers(false);
          }
        );
      } catch (error) {
        console.error('Error setting up team members listener:', error);
        setLoadingTeamMembers(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user types
    if (name === 'companyName' && errors.companyName) {
      setErrors(prev => ({ ...prev, companyName: '' }));
    } else if (name === 'email' && (errors.email || errors.contactFields)) {
      setErrors(prev => ({ ...prev, email: '', contactFields: '' }));
    } else if (name === 'phoneNumber' && (errors.phoneNumber || errors.contactFields)) {
      setErrors(prev => ({ ...prev, phoneNumber: '', contactFields: '' }));
    }
  };

  const handleHandledByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHandledBy(e.target.value);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      companyName: '',
      email: '',
      phoneNumber: '',
      contactFields: ''
    };

    // Company name is required
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
      isValid = false;
    }

    // Either email or phone is required
    if (!formData.email && !formData.phoneNumber) {
      newErrors.contactFields = 'Either email or phone number is required';
      isValid = false;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate phone format if provided
    if (formData.phoneNumber && !/^[+]?[\d\s()-]{7,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Find the selected team member's avatar
      const selectedMember = teamMembers.find(member => member.name === selectedHandledBy);
      
      // Get current user as handler if no team member is selected
      const handledBy = {
        name: selectedMember?.name || user?.name || 'Unknown User',
        avatar: selectedMember?.avatar || user?.avatar || ''
      };

      // Create the complete client object
      const clientData: NewClient = {
        ...formData,
        handledBy
      };

      await onSubmit(clientData);

      // Show notification
      await addNotification({
        title: isEdit ? 'Client Updated' : 'New Client Added',
        message: isEdit
          ? `${formData.companyName} client has been updated`
          : `${formData.companyName} has been added as a new client`,
        type: 'team'
      });

      // Close the form
      onClose();
    } catch (error) {
      console.error('Error submitting client:', error);
      
      // Show error notification
      await addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save client',
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
            {isEdit ? 'Edit Client' : 'Add New Client'}
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
                    {errors.companyName && (
                      <p className="text-[#d4a5a5] text-xs mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Contact Person Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                      placeholder="Enter Contact Person Name"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    >
                      <option value="">Select Business Type</option>
                      <option value="Cafe">Cafe</option>
                      <option value="Salon & Beauty">Salon & Beauty</option>
                      <option value="Creative Agency">Creative Agency</option>
                      <option value="Home Decor Store">Home Decor Store</option>
                      <option value="E-commerce Startup">E-commerce Startup</option>
                      <option value="Real Estate Agency">Real Estate Agency</option>
                      <option value="Hotel & Resort">Hotel & Resort</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.email ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`}
                      placeholder="Enter Email Address"
                    />
                    {errors.email && (
                      <p className="text-[#d4a5a5] text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.phoneNumber ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`}
                      placeholder="Enter Phone Number"
                    />
                    {errors.phoneNumber && (
                      <p className="text-[#d4a5a5] text-xs mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  {errors.contactFields && (
                    <div className="mb-5">
                      <p className="text-[#d4a5a5] text-xs">{errors.contactFields}</p>
                    </div>
                  )}

                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Address (Optional)
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[80px]"
                      placeholder="Enter Address"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Handled By
                    </label>
                    <select
                      value={selectedHandledBy}
                      onChange={handleHandledByChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                      disabled={loadingTeamMembers}
                    >
                      {loadingTeamMembers ? (
                        <option value="">Loading team members...</option>
                      ) : (
                        teamMembers.map(member => (
                          <option key={member.id} value={member.name}>
                            {member.name} {member.role === 'admin' ? '(Admin)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[100px]"
                  placeholder="Enter any additional notes about this client"
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
                    isEdit ? 'Save Changes' : 'Add Client'
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

export default ClientForm;
