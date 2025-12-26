import React, { useState, useEffect } from 'react';
import { XIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Lead, NewLead, useLeads } from '../contexts/LeadContext';
import { GooeyLoader } from './ui/loader-10';

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
  const { checkDuplicateLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);

  const [formData, setFormData] = useState<Omit<NewLead, 'handledBy'>>({
    companyName: initialLead?.companyName || '',
    contactPersonName: initialLead?.contactPersonName || '',
    businessType: initialLead?.businessType || '',
    socialMedia: initialLead?.socialMedia || '',
    email: initialLead?.email || initialLead?.contactInfo || '',
    phoneNumber: initialLead?.phoneNumber || '',
    progress: initialLead?.progress || 'Untouched',
    notes: initialLead?.notes || '',
    location: initialLead?.location || ''
  });

  const [errors, setErrors] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    contactFields: '' // Error for when both email and phone are empty
  });

  // Track the original values for edit mode
  const [originalEmail] = useState(initialLead?.email || initialLead?.contactInfo || '');
  const [originalPhoneNumber] = useState(initialLead?.phoneNumber || '');

  // Check for duplicates when the component mounts (for edit mode)
  useEffect(() => {
    if (isEdit) {
      // Check both email and phone if they exist
      if (formData.email) {
        checkForDuplicates('email', formData.email);
      }
      if (formData.phoneNumber) {
        checkForDuplicates('phoneNumber', formData.phoneNumber);
      }
    }
    // We only want this to run once on mount, so we're intentionally
    // not including dependencies that would cause it to re-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for duplicates when contact info changes
  const checkForDuplicates = (fieldName: 'email' | 'phoneNumber', value: string) => {
    if (!value.trim()) return;

    // Don't check if we're in edit mode and the value hasn't changed
    if (isEdit) {
      if (fieldName === 'email' && value === originalEmail) return;
      if (fieldName === 'phoneNumber' && value === originalPhoneNumber) return;
    }

    setIsDuplicateChecking(true);

    // Use the appropriate parameters based on which field we're checking
    const email = fieldName === 'email' ? value : undefined;
    const phoneNumber = fieldName === 'phoneNumber' ? value : undefined;

    // Use the excludeLeadId parameter in edit mode to exclude the current lead
    const duplicate = checkDuplicateLead(email, phoneNumber, isEdit ? initialLead?.id : undefined);

    if (duplicate) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `A lead with this ${fieldName === 'email' ? 'email address' : 'phone number'} already exists (${duplicate.companyName})`
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }

    setIsDuplicateChecking(false);
  };

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

    // Clear the contactFields error if either email or phone is being filled
    if ((name === 'email' || name === 'phoneNumber') && value.trim()) {
      setErrors(prev => ({
        ...prev,
        contactFields: ''
      }));
    }

    // Check for duplicates when email or phone changes
    if (name === 'email' && value.trim()) {
      checkForDuplicates('email', value);
    } else if (name === 'phoneNumber' && value.trim()) {
      checkForDuplicates('phoneNumber', value);
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      companyName: '',
      email: '',
      phoneNumber: '',
      contactFields: ''
    };

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
      valid = false;
    }

    // Check if at least one contact method is provided
    const hasEmail = formData.email && formData.email.trim() !== '';
    const hasPhone = formData.phoneNumber && formData.phoneNumber.trim() !== '';

    if (!hasEmail && !hasPhone) {
      newErrors.contactFields = 'At least one contact method (email or phone) is required';
      valid = false;
    } else {
      // Validate email format if provided
      if (hasEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email!)) {
          newErrors.email = 'Please enter a valid email address';
          valid = false;
        } else {
          // Check for duplicate email
          if (!isEdit || formData.email !== originalEmail) {
            const duplicate = checkDuplicateLead(formData.email, undefined, isEdit ? initialLead?.id : undefined);
            if (duplicate) {
              newErrors.email = `A lead with this email already exists (${duplicate.companyName})`;
              valid = false;
            }
          }
        }
      }

      // Validate phone format if provided
      if (hasPhone) {
        // Basic phone validation - at least 7 digits
        const phoneDigits = formData.phoneNumber!.replace(/\D/g, '');
        if (phoneDigits.length < 7) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
          valid = false;
        } else {
          // Check for duplicate phone
          if (!isEdit || formData.phoneNumber !== originalPhoneNumber) {
            const duplicate = checkDuplicateLead(undefined, formData.phoneNumber, isEdit ? initialLead?.id : undefined);
            if (duplicate) {
              newErrors.phoneNumber = `A lead with this phone number already exists (${duplicate.companyName})`;
              valid = false;
            }
          }
        }
      }
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

      // Check if it's a duplicate error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Duplicate lead')) {
        // Extract the company name from the error message if possible
        const companyMatch = errorMessage.match(/\(([^)]+)\)/);
        const companyName = companyMatch ? companyMatch[1] : '';

        // Determine which field has the duplicate
        if (errorMessage.includes('email')) {
          setErrors(prev => ({
            ...prev,
            email: `A lead with this email already exists${companyName ? ` (${companyName})` : ''}`
          }));
        } else if (errorMessage.includes('phone')) {
          setErrors(prev => ({
            ...prev,
            phoneNumber: `A lead with this phone number already exists${companyName ? ` (${companyName})` : ''}`
          }));
        } else {
          // Generic error if we can't determine which field
          setErrors(prev => ({
            ...prev,
            contactFields: `A lead with this contact information already exists${companyName ? ` (${companyName})` : ''}`
          }));
        }
      } else {
        // For other errors, show a notification
        await addNotification({
          title: 'Error',
          message: `Failed to ${isEdit ? 'update' : 'add'} lead. Please try again.`,
          type: 'system'
        });
      }
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
                    Email Address <span className="text-[#7a7067] text-xs">(optional if phone provided)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className={`bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.email ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`}
                      placeholder="Enter email address"
                    />
                    {isDuplicateChecking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="scale-50">
                          <GooeyLoader size="small" />
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <div className="flex items-start mt-2">
                      <AlertCircleIcon className="h-4 w-4 text-[#d4a5a5] mt-0.5 mr-1 flex-shrink-0" />
                      <p className="text-[#d4a5a5] text-xs">{errors.email}</p>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Phone Number <span className="text-[#7a7067] text-xs">(optional if email provided)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleChange}
                      className={`bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.phoneNumber ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <div className="flex items-start mt-2">
                      <AlertCircleIcon className="h-4 w-4 text-[#d4a5a5] mt-0.5 mr-1 flex-shrink-0" />
                      <p className="text-[#d4a5a5] text-xs">{errors.phoneNumber}</p>
                    </div>
                  )}
                </div>

                {/* Error message when both fields are empty */}
                {errors.contactFields && (
                  <div className="mb-5 -mt-2">
                    <div className="flex items-start">
                      <AlertCircleIcon className="h-4 w-4 text-[#d4a5a5] mt-0.5 mr-1 flex-shrink-0" />
                      <p className="text-[#d4a5a5] text-xs">{errors.contactFields}</p>
                    </div>
                  </div>
                )}
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
