import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileTextIcon, 
  EyeIcon, 
  EditIcon, 
  Trash2Icon, 
  Loader2Icon,
  PlusIcon,
  ReceiptIcon
} from 'lucide-react';
import { useQuotations, Quotation } from '../contexts/QuotationContext';
import { useInvoices } from '../contexts/InvoiceContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationDialog from './ConfirmationDialog';

interface ClientQuotationsProps {
  clientId: string;
  onQuotationCreated?: (quotationId: string) => void;
  onQuotationConverted?: (invoiceId: string) => void;
}

const ClientQuotations: React.FC<ClientQuotationsProps> = ({ 
  clientId, 
  onQuotationCreated,
  onQuotationConverted
}) => {
  const { getClientQuotations, removeQuotation, loading, error } = useQuotations();
  const { convertQuotationToInvoice } = useInvoices();
  const { addNotification } = useNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmConvertOpen, setIsConfirmConvertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    fetchClientQuotations();
  }, [clientId]);

  const fetchClientQuotations = async () => {
    setIsLoading(true);
    try {
      const clientQuotations = await getClientQuotations(clientId);
      setQuotations(clientQuotations);
    } catch (error) {
      console.error('Error fetching client quotations:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load quotations for this client',
        type: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuotation = (quotationId: string) => {
    navigate(`/quotations/${quotationId}`);
  };

  const handleEditQuotation = (quotationId: string) => {
    navigate(`/quotations/edit/${quotationId}`);
  };

  const handleDeleteQuotation = (quotation: Quotation) => {
    if (!isAdmin()) {
      addNotification({
        title: 'Permission Denied',
        message: 'Only administrators can delete quotations',
        type: 'system'
      });
      return;
    }
    setSelectedQuotation(quotation);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuotation) return;

    setIsDeleting(true);
    try {
      await removeQuotation(selectedQuotation.id);
      addNotification({
        title: 'Quotation Deleted',
        message: `Quotation ${selectedQuotation.quotationNumber} has been deleted`,
        type: 'team'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedQuotation(null);
      // Refresh the list
      fetchClientQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete quotation',
        type: 'system'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateQuotation = () => {
    navigate(`/quotations/new?clientId=${clientId}`);
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsConfirmConvertOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!selectedQuotation) return;

    setIsConverting(true);
    try {
      const invoiceId = await convertQuotationToInvoice(selectedQuotation);
      if (invoiceId) {
        addNotification({
          title: 'Quotation Converted',
          message: `Quotation ${selectedQuotation.quotationNumber} has been converted to an invoice`,
          type: 'team'
        });
        
        // Notify parent component if callback provided
        if (onQuotationConverted) {
          onQuotationConverted(invoiceId);
        }
        
        setIsConfirmConvertOpen(false);
        setSelectedQuotation(null);
        // Refresh the list
        fetchClientQuotations();
      } else {
        throw new Error('Failed to convert quotation to invoice');
      }
    } catch (error) {
      console.error('Error converting quotation to invoice:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to convert quotation to invoice',
        type: 'system'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      case 'Draft':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-[#3a3226]">Quotations</h3>
        <button
          onClick={handleCreateQuotation}
          className="inline-flex items-center px-3 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          New Quotation
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2Icon className="h-6 w-6 text-[#d4a5a5] animate-spin" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="bg-[#f5f0e8] p-4 rounded-lg text-center">
          <p className="text-[#3a3226]">No quotations found for this client.</p>
          <button
            onClick={handleCreateQuotation}
            className="mt-2 inline-flex items-center px-3 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create First Quotation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-[#f5f0e8]">
          <table className="min-w-full divide-y divide-[#f5f0e8]">
            <thead className="bg-[#f5f0e8]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Quotation #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#3a3226] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f0e8]">
              {quotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-[#f9f6f1]">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#3a3226]">{quotation.quotationNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#3a3226]">{formatDate(quotation.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#3a3226]">${quotation.total.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(quotation.status)}`}>
                      {quotation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewQuotation(quotation.id)}
                      className="text-[#3a3226] hover:text-[#d4a5a5] mr-2"
                      title="View Quotation"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditQuotation(quotation.id)}
                      className="text-[#3a3226] hover:text-[#d4a5a5] mr-2"
                      title="Edit Quotation"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    {quotation.status !== 'Accepted' && (
                      <button
                        onClick={() => handleConvertToInvoice(quotation)}
                        className="text-[#3a3226] hover:text-[#d4a5a5] mr-2"
                        title="Convert to Invoice"
                      >
                        <ReceiptIcon className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin() && (
                      <button
                        onClick={() => handleDeleteQuotation(quotation)}
                        className="text-[#3a3226] hover:text-red-500"
                        title="Delete Quotation"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      {isConfirmDeleteOpen && selectedQuotation && (
        <ConfirmationDialog
          title="Delete Quotation"
          message={`Are you sure you want to delete quotation ${selectedQuotation.quotationNumber}? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsConfirmDeleteOpen(false);
            setSelectedQuotation(null);
          }}
        />
      )}

      {/* Confirmation Dialog for Convert to Invoice */}
      {isConfirmConvertOpen && selectedQuotation && (
        <ConfirmationDialog
          title="Convert to Invoice"
          message={`Are you sure you want to convert quotation ${selectedQuotation.quotationNumber} to an invoice? This will mark the quotation as accepted.`}
          confirmLabel="Convert"
          cancelLabel="Cancel"
          isLoading={isConverting}
          onConfirm={handleConfirmConvert}
          onCancel={() => {
            setIsConfirmConvertOpen(false);
            setSelectedQuotation(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientQuotations;
