import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  SearchIcon,
  FileTextIcon,
  Trash2Icon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  BuildingIcon,
  CalendarIcon,
  ArrowRightIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useQuotations, Quotation } from '../contexts/QuotationContext';
import { useClients } from '../contexts/ClientContext';
import Avatar from '../components/Avatar';
import { debounce } from 'lodash';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationDialog from '../components/ConfirmationDialog';

const QuotationManagement = () => {
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const { quotations, removeQuotation, loading, error, refreshQuotations } = useQuotations();
  const { clients } = useClients();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Status options
  const statusOptions = ['Draft', 'Sent', 'Accepted', 'Declined'];

  // Filtered quotations based on search query and filters
  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation => {
      // Find client for this quotation
      const client = clients.find(c => c.id === quotation.clientId);
      const clientName = client?.companyName || '';

      // Search query filter
      const matchesSearch = 
        quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = !statusFilter || quotation.status === statusFilter;

      // Return true only if all filters match
      return matchesSearch && matchesStatus;
    });
  }, [quotations, clients, searchQuery, statusFilter]);

  // Handle search input with debounce
  const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, 300);

  const handleCreateQuotation = () => {
    navigate('/quotations/new');
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
        message: `${selectedQuotation.quotationNumber} has been deleted`,
        type: 'team'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedQuotation(null);
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

  const handleRefresh = async () => {
    try {
      await refreshQuotations();
      addNotification({
        title: 'Refreshed',
        message: 'Quotation list has been refreshed',
        type: 'system'
      });
    } catch (error) {
      console.error('Error refreshing quotations:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to refresh quotation list',
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
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileTextIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ArrowRightIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      case 'Accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
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
          Quotations
        </h1>
        <p className="text-[#7a7067]">
          Create and manage quotations for your clients.
        </p>
      </header>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search quotations..."
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
            aria-label="Refresh quotation list"
          >
            <RefreshCwIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleCreateQuotation}
            className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Quotation
          </button>
        </div>
      </div>

      {/* Quotation List */}
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
        ) : filteredQuotations.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-[#7a7067]">
            <FileTextIcon className="h-12 w-12 mb-4 text-[#d4a5a5]" />
            <p className="text-lg mb-2">No quotations found</p>
            <p className="text-sm">
              {searchQuery || statusFilter
                ? "Try adjusting your search or filters"
                : "Create your first quotation to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f5f0e8]">
              <thead className="bg-[#f5f0e8]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">
                    Quotation #
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
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-[#f9f6f1] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/quotations/${quotation.id}`} className="text-[#3a3226] hover:text-[#d4a5a5] font-medium">
                        {quotation.quotationNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                          <BuildingIcon className="h-4 w-4 text-[#d4a5a5]" />
                        </div>
                        <div className="text-sm text-[#3a3226]">{getClientName(quotation.clientId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3a3226]">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-[#7a7067]" />
                        {formatDate(quotation.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3a3226]">
                      {formatDate(quotation.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3a3226]">
                      ${quotation.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quotation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/quotations/${quotation.id}`}
                          className="text-[#7a7067] hover:text-[#3a3226] p-1 hover:bg-[#f5f0e8] rounded transition-colors"
                        >
                          <FileTextIcon className="h-4 w-4" />
                        </Link>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDeleteQuotation(quotation)}
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
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation ${selectedQuotation?.quotationNumber}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default QuotationManagement;
