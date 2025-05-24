import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  SearchIcon,
  ReceiptIcon,
  Trash2Icon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  BuildingIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useInvoices, Invoice } from '../contexts/InvoiceContext';
import { useClients } from '../contexts/ClientContext';
import Avatar from '../components/Avatar';
import { debounce } from 'lodash';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationDialog from '../components/ConfirmationDialog';

const InvoiceManagement = () => {
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const { invoices, removeInvoice, loading, error, refreshInvoices } = useInvoices();
  const { clients } = useClients();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Status options
  const statusOptions = ['Unpaid', 'Partially Paid', 'Paid', 'Overdue'];

  // Filtered invoices based on search query and filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Find client for this invoice
      const client = clients.find(c => c.id === invoice.clientId);
      const clientName = client?.companyName || '';

      // Search query filter
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = !statusFilter || invoice.paymentStatus === statusFilter;

      // Return true only if all filters match
      return matchesSearch && matchesStatus;
    });
  }, [invoices, clients, searchQuery, statusFilter]);

  // Handle search input with debounce
  const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, 300);

  const handleCreateInvoice = () => {
    navigate('/invoices/new');
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
        message: `${selectedInvoice.invoiceNumber} has been deleted`,
        type: 'team'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedInvoice(null);
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

  const handleRefresh = async () => {
    try {
      await refreshInvoices();
      addNotification({
        title: 'Refreshed',
        message: 'Invoice list has been refreshed',
        type: 'system'
      });
    } catch (error) {
      console.error('Error refreshing invoices:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to refresh invoice list',
        type: 'system'
      });
    }
  };

  // Helper function to get client name
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <CreditCardIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      <header className="mb-6 md:mb-8">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          Invoices
        </h1>
        <p className="text-[#7a7067]">
          Create and manage invoices for your clients.
        </p>
      </header>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
            onChange={handleSearchChange}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a7067]" size={18} />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white text-[#3a3226] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            className="p-3 bg-white text-[#7a7067] rounded-lg border border-[#f5f0e8] hover:bg-[#f5f0e8] transition-colors"
            aria-label="Refresh invoice list"
          >
            <RefreshCwIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleCreateInvoice}
            className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Invoice List */}
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
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-[#7a7067]">
            <ReceiptIcon className="h-12 w-12 mb-4 text-[#d4a5a5]" />
            <p className="text-lg mb-2">No invoices found</p>
            <p className="text-sm">
              {searchQuery || statusFilter
                ? "Try adjusting your search or filters"
                : "Create your first invoice to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f5f0e8]">
              <thead className="bg-[#f5f0e8]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#f5f0e8]">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#f9f6f1] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/invoices/${invoice.id}`} className="text-[#3a3226] hover:text-[#d4a5a5] font-medium">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                          <BuildingIcon className="h-4 w-4 text-[#d4a5a5]" />
                        </div>
                        <div className="text-sm text-[#3a3226]">{getClientName(invoice.clientId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3a3226]">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-[#7a7067]" />
                        {formatDate(invoice.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3a3226]">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3a3226]">
                      ${invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-[#7a7067] hover:text-[#3a3226] p-1 hover:bg-[#f5f0e8] rounded transition-colors"
                        >
                          <ReceiptIcon className="h-4 w-4" />
                        </Link>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="text-[#7a7067] hover:text-[#d4a5a5] p-1 hover:bg-[#f5f0e8] rounded transition-colors"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNumber}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default InvoiceManagement;
