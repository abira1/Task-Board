import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, SaveIcon, Loader2Icon, PrinterIcon, SendIcon, CreditCardIcon, PlusIcon, EditIcon, EyeIcon, CheckIcon, XIcon } from 'lucide-react';
import { useInvoices, Invoice } from '../contexts/InvoiceContext';
import { useClients, Client } from '../contexts/ClientContext';
import { usePayments } from '../contexts/PaymentContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import InvoiceTemplate, { InvoiceItem } from '../components/InvoiceTemplate';
import PrintableDocument from '../components/PrintableDocument';
import ClientSelector from '../components/ClientSelector';
import ItemsTable, { Item } from '../components/ItemsTable';
import SaveFeedback, { SaveStatus } from '../components/SaveFeedback';
import { useInvoiceLoader } from '../hooks/useDocumentLoader';

const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();
  const { user, isAdmin } = useAuth();
  const { getInvoice, addInvoice, updateInvoice, generateInvoiceNumber, updatePaymentStatus } = useInvoices();
  const { clients } = useClients();
  const { getActivePaymentMethods } = usePayments();

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Use the robust document loader for invoice data
  const { loading, error, data: loadedInvoice, retry } = useInvoiceLoader(getInvoice, id);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Web Design & Development', quantity: 1, rate: 800, amount: 800 },
    { id: '2', description: 'Admin Panel Integration', quantity: 1, rate: 230, amount: 230 }
  ]);

  // Get client ID from query params if creating from client page
  const queryParams = new URLSearchParams(location.search);
  const clientIdFromQuery = queryParams.get('clientId');

  // Handle loaded invoice data
  useEffect(() => {
    if (id && loadedInvoice) {
      // Edit mode - set loaded invoice data
      console.log('Setting loaded invoice data:', loadedInvoice);
      setInvoiceData(loadedInvoice);
      setSelectedClient(loadedInvoice.clientDetails || null);
      setIsEditMode(false); // Start in view mode for existing invoices
      setHasUnsavedChanges(false);

      if (loadedInvoice.items && loadedInvoice.items.length > 0) {
        console.log('Setting invoice items:', loadedInvoice.items);
        setInvoiceItems(loadedInvoice.items.map((item: any, index: number) => ({
          id: item.id || `item_${Date.now()}_${index}`,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })));
      } else {
        // Set default items if none exist
        setInvoiceItems([
          { id: '1', description: 'Web Design & Development', quantity: 1, rate: 800, amount: 800 },
          { id: '2', description: 'Admin Panel Integration', quantity: 1, rate: 230, amount: 230 }
        ]);
      }
    } else if (!id) {
      // Create mode - initialize with defaults
      setIsEditMode(true); // Start in edit mode for new invoices
      setHasUnsavedChanges(false);

      const initializeNewInvoice = async () => {
        try {
          console.log('Initializing new invoice');
          const invoiceNumber = await generateInvoiceNumber();
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + 30); // Due in 30 days

          const newInvoice = {
            invoiceNumber,
            invoiceDate: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'Unpaid',
            items: invoiceItems,
            subtotal: invoiceItems.reduce((sum, item) => sum + item.amount, 0),
            taxRate: 10,
            taxAmount: invoiceItems.reduce((sum, item) => sum + item.amount, 0) * 0.1,
            total: invoiceItems.reduce((sum, item) => sum + item.amount, 0) * 1.1,
            notes: "Let's craft digital experiences that feel just right."
          };

          setInvoiceData(newInvoice as any);
        } catch (error) {
          console.error('Error initializing new invoice:', error);
        }
      };

      initializeNewInvoice();
    }
  }, [id, loadedInvoice, generateInvoiceNumber, invoiceItems]);

  // Separate useEffect for client selection to avoid infinite loops
  useEffect(() => {
    if (clientIdFromQuery && clients.length > 0 && !selectedClient) {
      const client = clients.find(c => c.id === clientIdFromQuery);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clientIdFromQuery, clients, selectedClient]);

  // Check if user can edit this invoice
  const canEdit = () => {
    if (!invoiceData) return false;
    if (!id) return true; // New invoices can always be edited

    // Check if user is admin or creator
    const isCreator = invoiceData.createdBy?.id === user?.id;
    return isAdmin() || isCreator;
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      if (!confirmLeave) return;
    }
    navigate('/invoices');
  };

  const handleToggleEditMode = () => {
    if (!canEdit()) {
      addNotification({
        title: 'Permission Denied',
        message: 'You can only edit invoices you created or if you are an administrator',
        type: 'system'
      });
      return;
    }

    if (isEditMode && hasUnsavedChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel editing? Your changes will be lost.'
      );
      if (!confirmCancel) return;

      // Reset to original data
      if (loadedInvoice) {
        setInvoiceData(loadedInvoice);
        setSelectedClient(loadedInvoice.clientDetails || null);
        if (loadedInvoice.items && loadedInvoice.items.length > 0) {
          setInvoiceItems(loadedInvoice.items.map((item: any, index: number) => ({
            id: item.id || `item_${Date.now()}_${index}`,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          })));
        }
      }
      setHasUnsavedChanges(false);
    }

    setIsEditMode(!isEditMode);
  };

  const markAsChanged = () => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };

  // Payment status management functions
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Unpaid':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isValidStatusTransition = (currentStatus: string, newStatus: string) => {
    // Admin can make any transition
    if (isAdmin()) return true;

    // Define valid transitions for non-admin users
    const validTransitions: { [key: string]: string[] } = {
      'Unpaid': ['Partially Paid', 'Paid'],
      'Partially Paid': ['Paid'],
      'Paid': [], // Paid invoices cannot be changed by non-admin
      'Overdue': ['Partially Paid', 'Paid']
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const getStatusTransitionMessage = (currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return null;

    const messages: { [key: string]: string } = {
      'Unpaid->Partially Paid': 'Mark this invoice as partially paid?',
      'Unpaid->Paid': 'Mark this invoice as fully paid?',
      'Partially Paid->Paid': 'Mark this invoice as fully paid?',
      'Paid->Unpaid': 'Revert this invoice to unpaid status? This action should only be done if there was an error.',
      'Paid->Partially Paid': 'Change this invoice to partially paid? This action should only be done if there was an error.',
      'Overdue->Partially Paid': 'Mark this overdue invoice as partially paid?',
      'Overdue->Paid': 'Mark this overdue invoice as fully paid?'
    };

    return messages[`${currentStatus}->${newStatus}`] || `Change payment status from ${currentStatus} to ${newStatus}?`;
  };

  const canChangePaymentStatus = () => {
    if (!invoiceData || !id) return false;

    // Check if user is admin or creator
    const isCreator = invoiceData.createdBy?.id === user?.id;
    return isAdmin() || isCreator;
  };

  const handlePaymentStatusChange = async (newStatus: Invoice['paymentStatus']) => {
    if (!invoiceData || !id) return;

    const currentStatus = invoiceData.paymentStatus;

    // Check if status actually changed
    if (currentStatus === newStatus) return;

    // Check permissions
    if (!canChangePaymentStatus()) {
      addNotification({
        title: 'Permission Denied',
        message: 'You can only change payment status for invoices you created or if you are an administrator',
        type: 'system'
      });
      return;
    }

    // Check if transition is valid
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      addNotification({
        title: 'Invalid Status Change',
        message: `Cannot change payment status from ${currentStatus} to ${newStatus}. ${isAdmin() ? '' : 'Contact an administrator if this change is necessary.'}`,
        type: 'system'
      });
      return;
    }

    // Get confirmation message
    const confirmMessage = getStatusTransitionMessage(currentStatus, newStatus);
    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        // Reset the dropdown to current status
        setInvoiceData({
          ...invoiceData,
          paymentStatus: currentStatus
        });
        return;
      }
    }

    try {
      setSaving(true);

      // Use the updatePaymentStatus function from InvoiceContext
      await updatePaymentStatus(id, newStatus);

      // Update local state
      setInvoiceData({
        ...invoiceData,
        paymentStatus: newStatus,
        paymentDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : invoiceData.paymentDate
      });

      // Show success feedback
      setSaveStatus('success');
      setSaveMessage(`Payment status updated to ${newStatus}`);

      addNotification({
        title: 'Payment Status Updated',
        message: `Invoice ${invoiceData.invoiceNumber} payment status changed to ${newStatus}`,
        type: 'team'
      });

    } catch (error) {
      console.error('Error updating payment status:', error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to update payment status');

      // Reset the dropdown to current status
      setInvoiceData({
        ...invoiceData,
        paymentStatus: currentStatus
      });

      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update payment status',
        type: 'system'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleDownloadPdf = () => {
    // This will be handled by the PrintableDocument component
    console.log('Download PDF - handled by PrintableDocument');
  };

  const handleShare = () => {
    // Placeholder for share functionality
    console.log('Share invoice');
  };

  const handleAddItem = () => {
    if (!isEditMode) return;

    const newItem: InvoiceItem = {
      id: `item_${Date.now()}`,
      description: 'New Service',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setInvoiceItems([...invoiceItems, newItem]);
    markAsChanged();

    // Update invoice data with new calculations
    if (invoiceData) {
      const newSubtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0) + newItem.amount;
      const newTaxAmount = newSubtotal * (taxRate / 100);
      const newTotal = newSubtotal + newTaxAmount;

      setInvoiceData({
        ...invoiceData,
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        total: newTotal
      });
    }
  };

  // Calculate totals based on invoice items
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = invoiceData?.taxRate || 10;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSave = async () => {
    if (!invoiceData) return;

    setSaving(true);
    setSaveStatus('saving');
    setSaveMessage('Saving invoice...');

    try {
      // Validate required fields
      if (!selectedClient) {
        throw new Error('Please select a client');
      }
      if (invoiceItems.length === 0) {
        throw new Error('Please add at least one item');
      }

      // Recalculate totals to ensure accuracy
      const recalculatedSubtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      const recalculatedTaxAmount = recalculatedSubtotal * (taxRate / 100);
      const recalculatedTotal = recalculatedSubtotal + recalculatedTaxAmount;

      // Prepare invoice data with proper client association
      const invoice = {
        ...invoiceData,
        clientId: selectedClient.id,
        items: invoiceItems.map(item => ({
          ...item,
          id: item.id || `item_${Date.now()}_${Math.random()}`
        })),
        subtotal: recalculatedSubtotal,
        taxRate,
        taxAmount: recalculatedTaxAmount,
        total: recalculatedTotal,
        // Ensure date fields are properly set
        date: invoiceData.date || invoiceData.invoiceDate,
        invoiceDate: invoiceData.invoiceDate || invoiceData.date,
        // Set default values for optional fields
        discountType: invoiceData.discountType || 'percentage',
        discountValue: invoiceData.discountValue || 0,
        discountAmount: invoiceData.discountAmount || 0,
        paymentStatus: invoiceData.paymentStatus || 'Unpaid'
      };

      // Save to Firebase
      if (id) {
        // Update existing invoice
        await updateInvoice(id, invoice as any);
        setSaveStatus('success');
        setSaveMessage(`Invoice ${invoiceData.invoiceNumber} has been updated successfully`);
        setHasUnsavedChanges(false);
        setIsEditMode(false); // Exit edit mode after successful save
        addNotification({
          title: 'Invoice Updated',
          message: `Invoice ${invoiceData.invoiceNumber} has been updated`,
          type: 'team'
        });
      } else {
        // Create new invoice
        const invoiceId = await addInvoice(invoice as any);
        if (invoiceId) {
          setSaveStatus('success');
          setSaveMessage(`Invoice ${invoiceData.invoiceNumber} has been created successfully`);
          setHasUnsavedChanges(false);
          addNotification({
            title: 'Invoice Created',
            message: `Invoice ${invoiceData.invoiceNumber} has been created and is now accessible in the Invoices section`,
            type: 'team'
          });

          // If we came from client management, add another notification
          if (clientIdFromQuery) {
            addNotification({
              title: 'Client Invoice Added',
              message: `Invoice ${invoiceData.invoiceNumber} has been added to the client's records`,
              type: 'team'
            });
          }

          // Redirect to the invoice view page after a short delay
          setTimeout(() => {
            navigate(`/invoices/${invoiceId}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save invoice';
      setSaveStatus('error');
      setSaveMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className="mb-6 md:mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <button
              onClick={handleBack}
              className="mb-2 flex items-center text-[#7a7067] hover:text-[#3a3226] transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Invoices
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226]">
                {id ? (isEditMode ? 'Edit Invoice' : 'Invoice Details') : 'Create New Invoice'}
              </h1>
              {id && (
                <div className="flex items-center gap-2">
                  {isEditMode ? (
                    <span className="px-3 py-1 bg-[#d4a5a5] text-white text-sm rounded-full flex items-center">
                      <EditIcon className="h-3 w-3 mr-1" />
                      Editing
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-[#f5f0e8] text-[#3a3226] text-sm rounded-full flex items-center">
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Viewing
                    </span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Unsaved changes
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {id && canEdit() && (
              <button
                onClick={handleToggleEditMode}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  isEditMode
                    ? 'bg-[#7a7067] text-white hover:bg-[#6a6057]'
                    : 'bg-[#d4a5a5] text-white hover:bg-[#c99595]'
                }`}
                disabled={loading || saving}
              >
                {isEditMode ? (
                  <>
                    <XIcon className="h-5 w-5 mr-2" />
                    Cancel Edit
                  </>
                ) : (
                  <>
                    <EditIcon className="h-5 w-5 mr-2" />
                    Edit
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleShowPreview}
              className="px-4 py-2 bg-[#f5f0e8] text-[#3a3226] rounded-lg hover:bg-[#ebe6de] transition-colors flex items-center"
              disabled={loading || saving}
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Preview
            </button>

            {id && !isEditMode && (
              <button
                className="px-4 py-2 bg-[#f5f0e8] text-[#3a3226] rounded-lg hover:bg-[#ebe6de] transition-colors flex items-center"
                disabled={loading || saving}
              >
                <SendIcon className="h-5 w-5 mr-2" />
                Send
              </button>
            )}

            {id && !isEditMode && (
              <button
                className="px-4 py-2 bg-[#f5f0e8] text-[#3a3226] rounded-lg hover:bg-[#ebe6de] transition-colors flex items-center"
                disabled={loading || saving}
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Record Payment
              </button>
            )}

            {(isEditMode || !id) && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center"
                disabled={loading || saving}
              >
                {saving ? (
                  <>
                    <Loader2Icon className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-5 w-5 mr-2" />
                    Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Permission notice for non-editable invoices */}
        {id && !canEdit() && (
          <div className="bg-[#f9f6f1] border-l-4 border-[#d4a5a5] p-4 rounded-r-lg">
            <p className="text-[#3a3226] text-sm">
              <strong>View Only:</strong> You can only edit invoices you created or if you are an administrator.
            </p>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Preview */}
          <div className="bg-white rounded-lg shadow-sm p-4 h-full">
            {invoiceData && (
              <InvoiceTemplate
                invoiceNumber={invoiceData.invoiceNumber}
                invoiceDate={invoiceData.invoiceDate}
                date={invoiceData.date}
                dueDate={invoiceData.dueDate}
                clientName={selectedClient?.companyName || 'Cafe Colombia'}
                clientAddress={selectedClient?.address || 'Rua da Prata 250, Baixa District, Lisbon 1100-052, Portugal'}
                clientPhone={selectedClient?.phoneNumber}
                clientEmail={selectedClient?.email}
                items={invoiceItems}
                notes={invoiceData.notes}
                subtotal={invoiceData.subtotal || 0}
                taxRate={invoiceData.taxRate || 10}
                taxAmount={invoiceData.taxAmount || 0}
                total={invoiceData.total || 0}
                paymentInfo={{
                  bank: 'Bank Of America',
                  accountNumber: '00 0000 0000 0000 0000 00',
                  swift: 'TOIRAL12XXX'
                }}
                qrCodeUrl="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://toiral.com/invoice/123"
              />
            )}
          </div>

          {/* Invoice Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-[#3a3226]">Invoice Details</h2>
              {id && !isEditMode && (
                <span className="text-sm text-[#7a7067] bg-[#f5f0e8] px-3 py-1 rounded-full">
                  Read-only mode
                </span>
              )}
            </div>

            <div className="space-y-6">
              {/* Client Selector */}
              <ClientSelector
                selectedClientId={selectedClient?.id}
                onClientSelect={(client) => {
                  if (!isEditMode && id) return; // Prevent changes in view mode

                  setSelectedClient(client);
                  markAsChanged();

                  // Update invoice data with client information
                  if (invoiceData && client) {
                    setInvoiceData({
                      ...invoiceData,
                      clientId: client.id
                    });
                  }
                }}
                disabled={!!id && !isEditMode} // Disable client selection when viewing existing invoice
              />

              {/* Client Details (read-only) */}
              {selectedClient && (
                <div className="bg-[#f9f6f1] p-4 rounded-lg mt-2">
                  <h3 className="text-sm font-medium text-[#3a3226] mb-2">Client Details</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#7a7067]">Email:</p>
                      <p className="text-[#3a3226]">{selectedClient.email || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-[#7a7067]">Phone:</p>
                      <p className="text-[#3a3226]">{selectedClient.phoneNumber || 'N/A'}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[#7a7067]">Address:</p>
                      <p className="text-[#3a3226]">{selectedClient.address || 'N/A'}</p>
                    </div>

                    {selectedClient.leadId && (
                      <div className="col-span-2">
                        <p className="text-[#7a7067]">Converted from Lead</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Items
                </label>
                <ItemsTable
                  items={invoiceItems as Item[]}
                  onItemsChange={(updatedItems) => {
                    if (!isEditMode && id) return; // Prevent changes in view mode

                    setInvoiceItems(updatedItems as InvoiceItem[]);
                    markAsChanged();

                    // Update invoice data with new calculations
                    if (invoiceData) {
                      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
                      const newTaxAmount = newSubtotal * (taxRate / 100);
                      const newTotal = newSubtotal + newTaxAmount;

                      setInvoiceData({
                        ...invoiceData,
                        subtotal: newSubtotal,
                        taxAmount: newTaxAmount,
                        total: newTotal
                      });
                    }
                  }}
                  readOnly={!isEditMode && !!id}
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Discount
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none ${
                        isEditMode || !id
                          ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                          : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                      value={invoiceData?.discountType || 'percentage'}
                      disabled={!isEditMode && !!id}
                      onChange={(e) => {
                        if (!isEditMode && id) return;

                        markAsChanged();
                        if (invoiceData) {
                          setInvoiceData({
                            ...invoiceData,
                            discountType: e.target.value as 'percentage' | 'fixed'
                          });
                        }
                      }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] ${
                        isEditMode || !id
                          ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                          : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                      placeholder="Enter Amount"
                      value={invoiceData?.discountValue || 0}
                      disabled={!isEditMode && !!id}
                      onChange={(e) => {
                        if (!isEditMode && id) return;

                        markAsChanged();
                        if (invoiceData) {
                          const discountValue = parseFloat(e.target.value) || 0;
                          let discountAmount = 0;

                          if (invoiceData.discountType === 'percentage') {
                            discountAmount = subtotal * (discountValue / 100);
                          } else {
                            discountAmount = discountValue;
                          }

                          // Ensure discount doesn't exceed subtotal
                          discountAmount = Math.min(discountAmount, subtotal);

                          const taxableAmount = subtotal - discountAmount;
                          const taxAmount = taxableAmount * (taxRate / 100);
                          const total = taxableAmount + taxAmount;

                          setInvoiceData({
                            ...invoiceData,
                            discountValue,
                            discountAmount,
                            taxAmount,
                            total
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Invoice Date */}
                <div>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] ${
                      isEditMode || !id
                        ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                        : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    }`}
                    value={invoiceData?.date || invoiceData?.invoiceDate || ''}
                    disabled={!isEditMode && !!id}
                    onChange={(e) => {
                      if (!isEditMode && id) return;

                      markAsChanged();
                      if (invoiceData) {
                        setInvoiceData({
                          ...invoiceData,
                          date: e.target.value,
                          invoiceDate: e.target.value
                        });
                      }
                    }}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] ${
                      isEditMode || !id
                        ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                        : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    }`}
                    value={invoiceData?.dueDate || ''}
                    disabled={!isEditMode && !!id}
                    onChange={(e) => {
                      if (!isEditMode && id) return;

                      markAsChanged();
                      if (invoiceData) {
                        setInvoiceData({
                          ...invoiceData,
                          dueDate: e.target.value
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tax Rate */}
                <div>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] ${
                      isEditMode || !id
                        ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                        : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    }`}
                    value={invoiceData?.taxRate || 0}
                    disabled={!isEditMode && !!id}
                    onChange={(e) => {
                      if (!isEditMode && id) return;

                      markAsChanged();
                      if (invoiceData) {
                        const taxRate = parseFloat(e.target.value) || 0;
                        const taxAmount = subtotal * (taxRate / 100);
                        const total = subtotal + taxAmount;

                        setInvoiceData({
                          ...invoiceData,
                          taxRate,
                          taxAmount,
                          total
                        });
                      }
                    }}
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Payment Status
                  </label>
                  <div className="space-y-2">
                    {/* Current Status Badge */}
                    {id && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#7a7067]">Current:</span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(invoiceData?.paymentStatus || 'Unpaid')}`}>
                          {invoiceData?.paymentStatus || 'Unpaid'}
                        </span>
                        {invoiceData?.paymentDate && invoiceData.paymentStatus === 'Paid' && (
                          <span className="text-xs text-[#7a7067]">
                            Paid on {new Date(invoiceData.paymentDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Payment Status Dropdown */}
                    <select
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none ${
                        canChangePaymentStatus() && id
                          ? 'bg-[#f5f0e8] border-[#f5f0e8] cursor-pointer'
                          : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                      }`}
                      value={invoiceData?.paymentStatus || 'Unpaid'}
                      disabled={!canChangePaymentStatus() || !id}
                      onChange={(e) => {
                        const newStatus = e.target.value as Invoice['paymentStatus'];
                        if (id) {
                          handlePaymentStatusChange(newStatus);
                        } else {
                          // For new invoices, just update the local state
                          markAsChanged();
                          if (invoiceData) {
                            setInvoiceData({
                              ...invoiceData,
                              paymentStatus: newStatus
                            });
                          }
                        }
                      }}
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>

                    {/* Permission Notice */}
                    {id && !canChangePaymentStatus() && (
                      <p className="text-xs text-[#7a7067]">
                        Only the invoice creator or administrators can change payment status
                      </p>
                    )}

                    {/* Payment Status History */}
                    {id && invoiceData?.paymentStatusHistory && invoiceData.paymentStatusHistory.length > 0 && (
                      <div className="mt-3 p-3 bg-[#f9f6f1] rounded-lg">
                        <h4 className="text-sm font-medium text-[#3a3226] mb-2">Payment Status History</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {invoiceData.paymentStatusHistory
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((change, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full ${getPaymentStatusColor(change.newStatus)}`}>
                                  {change.newStatus}
                                </span>
                                <span className="text-[#7a7067]">
                                  by {change.changedBy.name}
                                </span>
                              </div>
                              <span className="text-[#7a7067]">
                                {new Date(change.date).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Note
                </label>
                <textarea
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[100px] ${
                    isEditMode || !id
                      ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                      : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                  }`}
                  placeholder="Type..."
                  value={invoiceData?.notes || ''}
                  disabled={!isEditMode && !!id}
                  onChange={(e) => {
                    if (!isEditMode && id) return;

                    markAsChanged();
                    if (invoiceData) {
                      setInvoiceData({
                        ...invoiceData,
                        notes: e.target.value
                      });
                    }
                  }}
                ></textarea>
              </div>
            </div>

            {(isEditMode || !id) && (
              <div className="mt-8">
                <p className="text-center text-[#7a7067] mb-4">
                  Keep it handy — print or save your invoice with ease.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleSave}
                    className="w-full px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2Icon className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="h-5 w-5 mr-2" />
                        Save Invoice
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShowPreview}
                    className="w-full px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print Invoice
                  </button>
                </div>
              </div>
            )}

            {/* View mode summary */}
            {id && !isEditMode && (
              <div className="mt-8 bg-[#f9f6f1] p-4 rounded-lg">
                <p className="text-center text-[#7a7067] text-sm">
                  {canEdit() ? (
                    <>Click the <strong>Edit</strong> button above to modify this invoice.</>
                  ) : (
                    <>This invoice is in view-only mode. You can only edit invoices you created.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreview && invoiceData && (
        <PrintableDocument
          title={`Invoice ${invoiceData.invoiceNumber}`}
          onClose={handleClosePreview}
          documentType="invoice"
          documentNumber={invoiceData.invoiceNumber}
          clientName={selectedClient?.companyName}
          onShare={handleShare}
        >
          <InvoiceTemplate
            invoiceNumber={invoiceData.invoiceNumber}
            invoiceDate={invoiceData.invoiceDate}
            dueDate={invoiceData.dueDate}
            clientName={selectedClient?.companyName || 'Cafe Colombia'}
            clientAddress={selectedClient?.address || 'Rua da Prata 250, Baixa District, Lisbon 1100-052, Portugal'}
            clientPhone={selectedClient?.phoneNumber}
            clientEmail={selectedClient?.email}
            items={invoiceItems}
            notes={invoiceData.notes}
            subtotal={invoiceData.subtotal || 0}
            taxRate={invoiceData.taxRate || 10}
            taxAmount={invoiceData.taxAmount || 0}
            total={invoiceData.total || 0}
            paymentInfo={{
              bank: 'Bank Of America',
              accountNumber: '00 0000 0000 0000 0000 00',
              swift: 'TOIRAL12XXX'
            }}
            qrCodeUrl="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://toiral.com/invoice/123"
          />
        </PrintableDocument>
      )}

      {/* Save Feedback */}
      <SaveFeedback
        status={saveStatus}
        message={saveMessage}
        error={error || undefined}
        onClose={() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }}
      />

      {/* Loading Error with Retry */}
      {error && !loading && (
        <div className="fixed bottom-4 left-4 z-50 max-w-md">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-md">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Failed to load invoice</p>
                <p className="mt-1 text-xs text-red-700">{error}</p>
              </div>
              <div className="ml-4">
                <button
                  onClick={retry}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceEditor;
