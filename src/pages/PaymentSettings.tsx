import React, { useState } from 'react';
import {
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
  AlertCircleIcon,
  CreditCardIcon,
  BuildingIcon,
  GlobeIcon,
  CheckIcon,
  XIcon,
  EditIcon,
  RefreshCwIcon,
  SaveIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { usePayments, PaymentMethod } from '../contexts/PaymentContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const PaymentSettings = () => {
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const {
    paymentSettings,
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    loading,
    error,
    refreshPaymentSettings
  } = usePayments();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding/editing payment methods
  const [formData, setFormData] = useState<{
    name: string;
    type: 'bank' | 'card' | 'online';
    details: Record<string, string>;
    isActive: boolean;
  }>({
    name: '',
    type: 'bank',
    details: {},
    isActive: true
  });

  // Get all payment methods
  const paymentMethods = getPaymentMethods();

  const handleRefresh = async () => {
    try {
      await refreshPaymentSettings();
      addNotification({
        title: 'Refreshed',
        message: 'Payment settings have been refreshed',
        type: 'system'
      });
    } catch (error) {
      console.error('Error refreshing payment settings:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to refresh payment settings',
        type: 'system'
      });
    }
  };

  const handleAddMethod = () => {
    // Reset form data
    setFormData({
      name: '',
      type: 'bank',
      details: {},
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      details: { ...method.details },
      isActive: method.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsConfirmDeleteOpen(true);
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefaultPaymentMethod(methodId);
      addNotification({
        title: 'Default Method Updated',
        message: 'Default payment method has been updated',
        type: 'system'
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to set default payment method',
        type: 'system'
      });
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await updatePaymentMethod(method.id, { isActive: !method.isActive });
      addNotification({
        title: 'Payment Method Updated',
        message: `Payment method has been ${method.isActive ? 'deactivated' : 'activated'}`,
        type: 'system'
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update payment method',
        type: 'system'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMethod) return;

    setIsSubmitting(true);
    try {
      await removePaymentMethod(selectedMethod.id);
      addNotification({
        title: 'Payment Method Deleted',
        message: `${selectedMethod.name} has been deleted`,
        type: 'system'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedMethod(null);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete payment method',
        type: 'system'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('detail_')) {
      // Handle detail fields
      const detailKey = name.replace('detail_', '');
      setFormData(prev => ({
        ...prev,
        details: {
          ...prev.details,
          [detailKey]: value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditModalOpen && selectedMethod) {
        // Update existing method
        await updatePaymentMethod(selectedMethod.id, formData);
        addNotification({
          title: 'Payment Method Updated',
          message: `${formData.name} has been updated`,
          type: 'system'
        });
        setIsEditModalOpen(false);
      } else {
        // Add new method
        await addPaymentMethod(formData);
        addNotification({
          title: 'Payment Method Added',
          message: `${formData.name} has been added`,
          type: 'system'
        });
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save payment method',
        type: 'system'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <BuildingIcon className="h-5 w-5 text-[#d4a5a5]" />;
      case 'card':
        return <CreditCardIcon className="h-5 w-5 text-[#d4a5a5]" />;
      case 'online':
        return <GlobeIcon className="h-5 w-5 text-[#d4a5a5]" />;
      default:
        return <CreditCardIcon className="h-5 w-5 text-[#d4a5a5]" />;
    }
  };

  // Helper function to get detail fields based on type
  const getDetailFields = (type: string) => {
    switch (type) {
      case 'bank':
        return [
          { key: 'bankName', label: 'Bank Name' },
          { key: 'accountName', label: 'Account Name' },
          { key: 'accountNumber', label: 'Account Number' },
          { key: 'routingNumber', label: 'Routing Number' },
          { key: 'instructions', label: 'Payment Instructions' }
        ];
      case 'card':
        return [
          { key: 'acceptedCards', label: 'Accepted Cards' },
          { key: 'processingFee', label: 'Processing Fee (%)' },
          { key: 'instructions', label: 'Payment Instructions' }
        ];
      case 'online':
        return [
          { key: 'provider', label: 'Provider Name' },
          { key: 'accountId', label: 'Account ID/Email' },
          { key: 'processingFee', label: 'Processing Fee (%)' },
          { key: 'instructions', label: 'Payment Instructions' }
        ];
      default:
        return [];
    }
  };

  return (
    <div>
      <header className="mb-6 md:mb-8">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          Payment Settings
        </h1>
        <p className="text-[#7a7067]">
          Configure payment methods for your invoices.
        </p>
      </header>

      {/* Action Bar */}
      <div className="flex justify-between mb-6">
        <div>
          <button
            onClick={handleRefresh}
            className="p-3 bg-white text-[#7a7067] rounded-lg border border-[#f5f0e8] hover:bg-[#f5f0e8] transition-colors"
            aria-label="Refresh payment settings"
          >
            <RefreshCwIcon className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={handleAddMethod}
          className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
            <div className="flex">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin" />
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-[#7a7067]">
            <CreditCardIcon className="h-12 w-12 mb-4 text-[#d4a5a5]" />
            <p className="text-lg mb-2">No payment methods configured</p>
            <p className="text-sm">
              Add your first payment method to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f0e8]">
            {paymentMethods.map((method) => (
              <div key={method.id} className="p-4 hover:bg-[#f9f6f1] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center mr-4">
                      {getTypeIcon(method.type)}
                    </div>
                    <div>
                      <h3 className="text-[#3a3226] font-medium flex items-center">
                        {method.name}
                        {paymentSettings?.defaultMethod === method.id && (
                          <span className="ml-2 px-2 py-0.5 bg-[#f5f0e8] text-[#3a3226] text-xs rounded-full">
                            Default
                          </span>
                        )}
                        {!method.isActive && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </h3>
                      <p className="text-[#7a7067] text-sm capitalize">
                        {method.type} Payment
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {paymentSettings?.defaultMethod !== method.id && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded transition-colors"
                        title="Set as default"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(method)}
                      className={`p-2 ${method.isActive ? 'text-[#7a7067] hover:text-red-500' : 'text-[#7a7067] hover:text-green-500'} hover:bg-[#f5f0e8] rounded transition-colors`}
                      title={method.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {method.isActive ? (
                        <XIcon className="h-4 w-4" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditMethod(method)}
                      className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded transition-colors"
                      title="Edit"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method)}
                      className="p-2 text-[#7a7067] hover:text-[#d4a5a5] hover:bg-[#f5f0e8] rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Payment Method Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm md:max-w-2xl lg:max-w-4xl rounded-xl shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-[#f5f0e8] bg-white">
              <h2 className="font-medium text-xl md:text-2xl text-[#3a3226]">
                {isEditModalOpen ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button
                onClick={() => isEditModalOpen ? setIsEditModalOpen(false) : setIsAddModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226] transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">

            <form id="payment-method-form" onSubmit={handleSubmitForm}>
              {/* Basic Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-[#3a3226] mb-4 border-b border-[#f5f0e8] pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Method Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] transition-colors min-h-[44px]"
                      placeholder="e.g., Bank Transfer, Credit Card, PayPal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#3a3226] text-sm font-medium mb-2">
                      Method Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] transition-colors min-h-[44px] appearance-none"
                      required
                    >
                      <option value="bank">Bank Transfer</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-[#3a3226] mb-4 border-b border-[#f5f0e8] pb-2">
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {getDetailFields(formData.type).map((field, index) => {
                    // Instructions field should span full width on desktop
                    const isInstructionsField = field.key === 'instructions';
                    const fieldClasses = isInstructionsField
                      ? "lg:col-span-2"
                      : "";

                    return (
                      <div key={field.key} className={fieldClasses}>
                        <label className="block text-[#3a3226] text-sm font-medium mb-2">
                          {field.label}
                        </label>
                        {isInstructionsField ? (
                          <textarea
                            name={`detail_${field.key}`}
                            value={formData.details[field.key] || ''}
                            onChange={handleFormChange}
                            className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] transition-colors min-h-[80px] resize-vertical"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            rows={3}
                          />
                        ) : (
                          <input
                            type="text"
                            name={`detail_${field.key}`}
                            value={formData.details[field.key] || ''}
                            onChange={handleFormChange}
                            className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] transition-colors min-h-[44px]"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-[#3a3226] mb-4 border-b border-[#f5f0e8] pb-2">
                  Status
                </h3>
                <div className="flex items-center p-4 bg-[#f9f6f1] rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-5 w-5 text-[#d4a5a5] focus:ring-[#d4a5a5] border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-[#3a3226]">
                    Active Payment Method
                  </label>
                </div>
                <p className="text-xs text-[#7a7067] mt-2">
                  Inactive payment methods will not be available for selection in invoices
                </p>
              </div>
            </form>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="border-t border-[#f5f0e8] bg-white p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => isEditModalOpen ? setIsEditModalOpen(false) : setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#f5f0e8] text-[#7a7067] rounded-lg hover:bg-[#ebe6de] transition-colors font-medium min-h-[44px]"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="payment-method-form"
                  className="w-full sm:w-auto px-6 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center font-medium min-h-[44px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {isEditModalOpen ? 'Update Method' : 'Add Method'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Method"
        message={`Are you sure you want to delete ${selectedMethod?.name}? This action cannot be undone.`}
        confirmText={isSubmitting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default PaymentSettings;
