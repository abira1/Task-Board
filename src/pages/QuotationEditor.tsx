import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, SaveIcon, Loader2Icon, PrinterIcon, SendIcon, ReceiptIcon, PlusIcon, EditIcon, EyeIcon, CheckIcon, XIcon } from 'lucide-react';
import { useQuotations, Quotation } from '../contexts/QuotationContext';
import { useClients, Client } from '../contexts/ClientContext';
import { useInvoices } from '../contexts/InvoiceContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import QuotationTemplate, { QuotationItem } from '../components/QuotationTemplate';
import PrintableDocument from '../components/PrintableDocument';
import ClientSelector from '../components/ClientSelector';
import ItemsTable, { Item } from '../components/ItemsTable';
import SaveFeedback, { SaveStatus } from '../components/SaveFeedback';
import ServiceSelector from '../components/ServiceSelector';
import { useQuotationLoader } from '../hooks/useDocumentLoader';

const QuotationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();
  const { user, isAdmin } = useAuth();
  const { getQuotation, addQuotation, updateQuotation, generateQuotationNumber, calculateQuotation } = useQuotations();
  const { clients } = useClients();
  const { convertQuotationToInvoice } = useInvoices();

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [quotationData, setQuotationData] = useState<Quotation | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Use the robust document loader for quotation data
  const { loading, error, data: loadedQuotation, retry } = useQuotationLoader(getQuotation, id);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([
    { id: '1', description: 'Web Design & Development', quantity: 1, unit: 'package', rate: 800, amount: 800 },
    { id: '2', description: 'Admin Panel Integration', quantity: 1, unit: 'website', rate: 230, amount: 230 },
    { id: '3', description: 'Logo Design', quantity: 1, unit: 'icon', rate: 250, amount: 250 },
    { id: '4', description: 'UI/UX Wireframe', quantity: 10, unit: 'Screen', rate: 30, amount: 300 },
    { id: '5', description: 'Landing Page Mockup', quantity: 1, unit: 'page', rate: 180, amount: 180 },
    { id: '6', description: 'Social Media Graphic Set', quantity: 5, unit: 'posts', rate: 40, amount: 200 },
    { id: '7', description: 'Branding Style Guide', quantity: 1, unit: 'document', rate: 350, amount: 350 },
    { id: '8', description: 'Infographic Design', quantity: 1, unit: 'infographic', rate: 220, amount: 220 }
  ]);

  // Get client ID from query params if creating from client page
  const queryParams = new URLSearchParams(location.search);
  const clientIdFromQuery = queryParams.get('clientId');

  // Handle loaded quotation data
  useEffect(() => {
    if (id && loadedQuotation) {
      // Edit mode - set loaded quotation data
      console.log('Setting loaded quotation data:', loadedQuotation);
      setQuotationData(loadedQuotation);
      setSelectedClient(loadedQuotation.clientDetails || null);
      setIsEditMode(false); // Start in view mode for existing quotations
      setHasUnsavedChanges(false);

      if (loadedQuotation.items && loadedQuotation.items.length > 0) {
        console.log('Setting quotation items:', loadedQuotation.items);
        setQuotationItems(loadedQuotation.items.map((item: any, index: number) => ({
          id: item.id || `item_${Date.now()}_${index}`,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || '',
          rate: item.rate,
          amount: item.amount
        })));
      } else {
        // Keep default items if none exist in the quotation
        console.log('No items found in quotation, keeping default items');
      }
    } else if (!id) {
      // Create mode - initialize with defaults
      setIsEditMode(true); // Start in edit mode for new quotations
      setHasUnsavedChanges(false);

      const initializeNewQuotation = async () => {
        try {
          console.log('Initializing new quotation');
          const quotationNumber = await generateQuotationNumber();
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + 30); // Due in 30 days

          const subtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0);
          const taxRate = 10;
          const taxAmount = subtotal * (taxRate / 100);
          const total = subtotal + taxAmount;

          const newQuotation = {
            quotationNumber,
            date: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'Pending',
            items: quotationItems,
            subtotal,
            taxRate,
            taxAmount,
            total,
            notes: "Quotation includes standard services. Scope subject to revision upon delivery."
          };

          setQuotationData(newQuotation as any);
        } catch (error) {
          console.error('Error initializing new quotation:', error);
        }
      };

      initializeNewQuotation();
    }
  }, [id, loadedQuotation, generateQuotationNumber, quotationItems]);

  // Separate useEffect for client selection to avoid infinite loops
  useEffect(() => {
    if (clientIdFromQuery && clients.length > 0 && !selectedClient) {
      const client = clients.find(c => c.id === clientIdFromQuery);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clientIdFromQuery, clients, selectedClient]);

  // Check if user can edit this quotation
  const canEdit = () => {
    if (!quotationData) return false;
    if (!id) return true; // New quotations can always be edited

    // Check if user is admin or creator
    const isCreator = quotationData.createdBy?.id === user?.id;
    return isAdmin() || isCreator;
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      if (!confirmLeave) return;
    }
    navigate('/quotations');
  };

  const handleToggleEditMode = () => {
    if (!canEdit()) {
      addNotification({
        title: 'Permission Denied',
        message: 'You can only edit quotations you created or if you are an administrator',
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
      if (loadedQuotation) {
        setQuotationData(loadedQuotation);
        setSelectedClient(loadedQuotation.clientDetails || null);
        if (loadedQuotation.items && loadedQuotation.items.length > 0) {
          setQuotationItems(loadedQuotation.items.map((item: any, index: number) => ({
            id: item.id || `item_${Date.now()}_${index}`,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || '',
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
    console.log('Share quotation');
  };

  const handleAddItem = () => {
    if (!isEditMode) return;

    const newItem: QuotationItem = {
      id: `item_${Date.now()}`,
      description: 'New Service',
      quantity: 1,
      unit: 'item',
      rate: 0,
      amount: 0
    };
    setQuotationItems([...quotationItems, newItem]);
    markAsChanged();

    // Update quotation data with new calculations
    if (quotationData) {
      const newSubtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0) + newItem.amount;
      const newTaxAmount = newSubtotal * (taxRate / 100);
      const newTotal = newSubtotal + newTaxAmount;

      setQuotationData({
        ...quotationData,
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        total: newTotal
      });
    }
  };

  // Calculate totals based on quotation items
  const subtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = quotationData?.taxRate || 10;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSave = async () => {
    if (!quotationData) return;

    setSaving(true);
    setSaveStatus('saving');
    setSaveMessage('Saving quotation...');

    try {
      // Validate required fields
      if (!selectedClient) {
        throw new Error('Please select a client');
      }
      if (quotationItems.length === 0) {
        throw new Error('Please add at least one item');
      }

      // Recalculate totals to ensure accuracy
      const recalculatedSubtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0);
      const recalculatedTaxAmount = recalculatedSubtotal * (taxRate / 100);
      const recalculatedTotal = recalculatedSubtotal + recalculatedTaxAmount;

      // Prepare quotation data with proper client association
      const quotation = {
        ...quotationData,
        clientId: selectedClient.id,
        items: quotationItems,
        subtotal: recalculatedSubtotal,
        taxRate,
        taxAmount: recalculatedTaxAmount,
        total: recalculatedTotal,
        status: quotationData.status || 'Draft',
        // Ensure date fields are properly set
        date: quotationData.date || new Date().toISOString().split('T')[0],
        dueDate: quotationData.dueDate || (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toISOString().split('T')[0];
        })()
      };

      // Save to Firebase
      if (id) {
        // Update existing quotation
        await updateQuotation(id, quotation);
        setSaveStatus('success');
        setSaveMessage(`Quotation ${quotationData.quotationNumber} has been updated successfully`);
        setHasUnsavedChanges(false);
        setIsEditMode(false); // Exit edit mode after successful save
        addNotification({
          title: 'Quotation Updated',
          message: `Quotation ${quotationData.quotationNumber} has been updated`,
          type: 'team'
        });
      } else {
        // Create new quotation
        const quotationId = await addQuotation(quotation as any);
        if (quotationId) {
          setSaveStatus('success');
          setSaveMessage(`Quotation ${quotationData.quotationNumber} has been created successfully`);
          setHasUnsavedChanges(false);
          addNotification({
            title: 'Quotation Created',
            message: `Quotation ${quotationData.quotationNumber} has been created and is now accessible in the Quotations section`,
            type: 'team'
          });

          // If we came from client management, add another notification
          if (clientIdFromQuery) {
            addNotification({
              title: 'Client Quotation Added',
              message: `Quotation ${quotationData.quotationNumber} has been added to the client's records`,
              type: 'team'
            });
          }

          // Redirect to the quotation view page after a short delay
          setTimeout(() => {
            navigate(`/quotations/${quotationId}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save quotation';
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
              Back to Quotations
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226]">
                {id ? (isEditMode ? 'Edit Quotation' : 'Quotation Details') : 'Create New Quotation'}
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
                onClick={async () => {
                  if (!quotationData) return;

                  setSaving(true);
                  try {
                    const invoiceId = await convertQuotationToInvoice(quotationData);
                    if (invoiceId) {
                      addNotification({
                        title: 'Quotation Converted',
                        message: `Quotation ${quotationData.quotationNumber} has been converted to an invoice`,
                        type: 'team'
                      });

                      // Redirect to the invoice view page
                      navigate(`/invoices/${invoiceId}`);
                    }
                  } catch (error) {
                    console.error('Error converting quotation to invoice:', error);
                    setSaveStatus('error');
                    setSaveMessage(error instanceof Error ? error.message : 'Failed to convert quotation to invoice');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-4 py-2 bg-[#f5f0e8] text-[#3a3226] rounded-lg hover:bg-[#ebe6de] transition-colors flex items-center"
                disabled={loading || saving || quotationData?.status === 'Accepted'}
              >
                <ReceiptIcon className="h-5 w-5 mr-2" />
                Convert to Invoice
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

        {/* Permission notice for non-editable quotations */}
        {id && !canEdit() && (
          <div className="bg-[#f9f6f1] border-l-4 border-[#d4a5a5] p-4 rounded-r-lg">
            <p className="text-[#3a3226] text-sm">
              <strong>View Only:</strong> You can only edit quotations you created or if you are an administrator.
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
          {/* Quotation Preview */}
          <div className="bg-white rounded-lg shadow-sm p-4 h-full">
            {quotationData && (
              <QuotationTemplate
                quotationNumber={quotationData.quotationNumber}
                date={quotationData.date}
                dueDate={quotationData.dueDate}
                clientName={selectedClient?.companyName || 'Cafe Colombia'}
                clientAddress={selectedClient?.address || 'Rua da Prata 250, Baixa District, Lisbon 1100-052, Portugal'}
                clientPhone={selectedClient?.phoneNumber}
                clientEmail={selectedClient?.email}
                items={quotationItems}
                notes={quotationData.notes}
                subtotal={quotationData.subtotal || 0}
                taxRate={quotationData.taxRate || 10}
                taxAmount={quotationData.taxAmount || 0}
                total={quotationData.total || 0}
                qrCodeUrl="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://toiral.com/quotation/123"
              />
            )}
          </div>

          {/* Quotation Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-[#3a3226]">Quotation Details</h2>
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

                  // Update quotation data with client information
                  if (quotationData && client) {
                    setQuotationData({
                      ...quotationData,
                      clientId: client.id
                    });
                  }
                }}
                disabled={!!id && !isEditMode} // Disable client selection when viewing existing quotation
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

              <div className="grid grid-cols-2 gap-4">
                {/* Add Services Button */}
                {(isEditMode || !id) && (
                  <div>
                    <button
                      onClick={handleAddItem}
                      className="w-full px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isEditMode && !!id}
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Services
                    </button>
                  </div>
                )}

                {/* Discount */}
                <div className={`${(isEditMode || !id) ? '' : 'col-span-2'}`}>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Discount
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] ${
                      isEditMode || !id
                        ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                        : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    }`}
                    placeholder="Enter Amount"
                    disabled={!isEditMode && !!id}
                    onChange={() => markAsChanged()}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Items
                </label>
                <ItemsTable
                  items={quotationItems as Item[]}
                  onItemsChange={(updatedItems) => {
                    if (!isEditMode && id) return; // Prevent changes in view mode

                    setQuotationItems(updatedItems as QuotationItem[]);
                    markAsChanged();

                    // Update quotation data with new calculations
                    if (quotationData) {
                      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
                      const newTaxAmount = newSubtotal * (taxRate / 100);
                      const newTotal = newSubtotal + newTaxAmount;

                      setQuotationData({
                        ...quotationData,
                        subtotal: newSubtotal,
                        taxAmount: newTaxAmount,
                        total: newTotal
                      });
                    }
                  }}
                  readOnly={!isEditMode && !!id}
                />
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
                  value={quotationData?.notes || ''}
                  disabled={!isEditMode && !!id}
                  onChange={(e) => {
                    if (!isEditMode && id) return;

                    markAsChanged();
                    if (quotationData) {
                      setQuotationData({
                        ...quotationData,
                        notes: e.target.value
                      });
                    }
                  }}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    value={quotationData?.dueDate || ''}
                    disabled={!isEditMode && !!id}
                    onChange={(e) => {
                      if (!isEditMode && id) return;

                      markAsChanged();
                      if (quotationData) {
                        setQuotationData({
                          ...quotationData,
                          dueDate: e.target.value
                        });
                      }
                    }}
                  />
                </div>

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
                    value={quotationData?.taxRate || 0}
                    disabled={!isEditMode && !!id}
                    onChange={(e) => {
                      if (!isEditMode && id) return;

                      markAsChanged();
                      if (quotationData) {
                        const taxRate = parseFloat(e.target.value) || 0;
                        const taxAmount = subtotal * (taxRate / 100);
                        const total = subtotal + taxAmount;

                        setQuotationData({
                          ...quotationData,
                          taxRate,
                          taxAmount,
                          total
                        });
                      }
                    }}
                  />
                </div>
              </div>

              {/* Quotation Status */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] appearance-none ${
                    isEditMode || !id
                      ? 'bg-[#f5f0e8] border-[#f5f0e8]'
                      : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                  }`}
                  value={quotationData?.status || 'Draft'}
                  disabled={!isEditMode && !!id}
                  onChange={(e) => {
                    if (!isEditMode && id) return;

                    markAsChanged();
                    if (quotationData) {
                      setQuotationData({
                        ...quotationData,
                        status: e.target.value as 'Draft' | 'Sent' | 'Accepted' | 'Declined'
                      });
                    }
                  }}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>

            {(isEditMode || !id) && (
              <div className="mt-8">
                <p className="text-center text-[#7a7067] mb-4">
                  Keep it handy — print or save your quotation with ease.
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
                        Save Quotation
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShowPreview}
                    className="w-full px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print Quotation
                  </button>
                </div>
              </div>
            )}

            {/* View mode summary */}
            {id && !isEditMode && (
              <div className="mt-8 bg-[#f9f6f1] p-4 rounded-lg">
                <p className="text-center text-[#7a7067] text-sm">
                  {canEdit() ? (
                    <>Click the <strong>Edit</strong> button above to modify this quotation.</>
                  ) : (
                    <>This quotation is in view-only mode. You can only edit quotations you created.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotation Preview Modal */}
      {showPreview && quotationData && (
        <PrintableDocument
          title={`Quotation ${quotationData.quotationNumber}`}
          onClose={handleClosePreview}
          documentType="quotation"
          documentNumber={quotationData.quotationNumber}
          clientName={selectedClient?.companyName}
          onShare={handleShare}
        >
          <QuotationTemplate
            quotationNumber={quotationData.quotationNumber}
            date={quotationData.date}
            dueDate={quotationData.dueDate}
            clientName={selectedClient?.companyName || 'Cafe Colombia'}
            clientAddress={selectedClient?.address || 'Rua da Prata 250, Baixa District, Lisbon 1100-052, Portugal'}
            clientPhone={selectedClient?.phoneNumber}
            clientEmail={selectedClient?.email}
            items={quotationItems}
            notes={quotationData.notes}
            subtotal={quotationData.subtotal || 0}
            taxRate={quotationData.taxRate || 10}
            taxAmount={quotationData.taxAmount || 0}
            total={quotationData.total || 0}
            qrCodeUrl="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://toiral.com/quotation/123"
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
                <p className="text-sm font-medium text-red-800">Failed to load quotation</p>
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

export default QuotationEditor;
