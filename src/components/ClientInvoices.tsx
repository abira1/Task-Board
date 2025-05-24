import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ReceiptIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  Loader2Icon,
  PlusIcon
} from 'lucide-react';
import { useInvoices, Invoice } from '../contexts/InvoiceContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationDialog from './ConfirmationDialog';

interface ClientInvoicesProps {
  clientId: string;
  onInvoiceCreated?: (invoiceId: string) => void;
}

const ClientInvoices: React.FC<ClientInvoicesProps> = ({ clientId, onInvoiceCreated }) => {
  const { getClientInvoices, removeInvoice, loading, error } = useInvoices();
  const { addNotification } = useNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClientInvoices();
  }, [clientId]);

  const fetchClientInvoices = async () => {
    setIsLoading(true);
    try {
      const clientInvoices = await getClientInvoices(clientId);
      setInvoices(clientInvoices);
    } catch (error) {
      console.error('Error fetching client invoices:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load invoices for this client',
        type: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleEditInvoice = (invoiceId: string) => {
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    if (!isAdmin()) {
      addNotification({
        title: 'Permission Denied',
        message: 'Only administrators can delete invoices',
        type: 'system'
      });
      return;
    }
    setSelectedInvoice(invoice);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInvoice) return;

    setIsDeleting(true);
    try {
      await removeInvoice(selectedInvoice.id);
      addNotification({
        title: 'Invoice Deleted',
        message: `Invoice ${selectedInvoice.invoiceNumber} has been deleted`,
        type: 'team'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedInvoice(null);
      // Refresh the list
      fetchClientInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete invoice',
        type: 'system'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateInvoice = () => {
    navigate(`/invoices/new?clientId=${clientId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Unpaid':
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
        <h3 className="text-lg font-medium text-[#3a3226]">Invoices</h3>
        <button
          onClick={handleCreateInvoice}
          className="inline-flex items-center px-3 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          New Invoice
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2Icon className="h-6 w-6 text-[#d4a5a5] animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-[#f5f0e8] p-4 rounded-lg text-center">
          <p className="text-[#3a3226]">No invoices found for this client.</p>
          <button
            onClick={handleCreateInvoice}
            className="mt-2 inline-flex items-center px-3 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create First Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-[#f5f0e8]">
          <table className="min-w-full divide-y divide-[#f5f0e8]">
            <thead className="bg-[#f5f0e8]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#3a3226] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f0e8]">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-[#f9f6f1]">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#3a3226]">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#3a3226]">{formatDate(invoice.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#3a3226]">${invoice.total.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewInvoice(invoice.id)}
                      className="text-[#3a3226] hover:text-[#d4a5a5] mr-2"
                      title="View Invoice"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditInvoice(invoice.id)}
                      className="text-[#3a3226] hover:text-[#d4a5a5] mr-2"
                      title="Edit Invoice"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={() => handleDeleteInvoice(invoice)}
                        className="text-[#3a3226] hover:text-red-500"
                        title="Delete Invoice"
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
      {isConfirmDeleteOpen && selectedInvoice && (
        <ConfirmationDialog
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${selectedInvoice.invoiceNumber}? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsConfirmDeleteOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientInvoices;
