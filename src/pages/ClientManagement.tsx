import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  Trash2Icon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  XIcon,
  RefreshCwIcon,
  WifiOffIcon,
  AlertCircleIcon,
  BuildingIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  Users2Icon,
  FileTextIcon,
  ReceiptIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  InfoIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useClients, Client } from '../contexts/ClientContext';
import { useLeads, Lead } from '../contexts/LeadContext';
import ClientForm from '../components/ClientForm';
import ClientInvoices from '../components/ClientInvoices';
import ClientQuotations from '../components/ClientQuotations';
import Avatar from '../components/Avatar';
import { debounce } from 'lodash';
import { Link } from 'react-router-dom';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ClientManagement = () => {
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const { clients, addClient, updateClient, removeClient, loading, error, refreshClients } = useClients();
  const { leads } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConvertLeadModalOpen, setIsConvertLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Filter states
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Business type options
  const businessTypes = [
    'Cafe',
    'Salon & Beauty',
    'Creative Agency',
    'Home Decor Store',
    'E-commerce Startup',
    'Real Estate Agency',
    'Hotel & Resort',
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Other'
  ];

  // Status options
  const statusOptions = ['Active', 'Inactive'];

  // Filtered clients based on search query and filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search query filter
      const matchesSearch =
        client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.contactPersonName && client.contactPersonName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.phoneNumber && client.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      // Business type filter
      const matchesBusinessType = !businessTypeFilter || client.businessType === businessTypeFilter;

      // Status filter
      const matchesStatus = !statusFilter || client.status === statusFilter;

      // Return true only if all filters match
      return matchesSearch && matchesBusinessType && matchesStatus;
    });
  }, [clients, searchQuery, businessTypeFilter, statusFilter]);

  // Confirmed leads that can be converted to clients
  const confirmedLeads = useMemo(() => {
    return leads.filter(lead => lead.progress === 'Confirm');
  }, [leads]);

  // Handle search input with debounce
  const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, 300);

  const handleAddClient = () => {
    setIsAddClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    if (!isAdmin()) {
      addNotification({
        title: 'Permission Denied',
        message: 'Only administrators can delete clients',
        type: 'system'
      });
      return;
    }
    setSelectedClient(client);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;

    setIsDeleting(true);
    try {
      await removeClient(selectedClient.id);
      addNotification({
        title: 'Client Deleted',
        message: `${selectedClient.companyName} has been deleted`,
        type: 'team'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete client',
        type: 'system'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpandClient = (clientId: string) => {
    setExpandedClientId(currentId => currentId === clientId ? null : clientId);
  };

  const handleRefresh = async () => {
    try {
      await refreshClients();
      addNotification({
        title: 'Refreshed',
        message: 'Client list has been refreshed',
        type: 'system'
      });
    } catch (error) {
      console.error('Error refreshing clients:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to refresh client list',
        type: 'system'
      });
    }
  };

  const handleOpenConvertLeadModal = () => {
    setIsConvertLeadModalOpen(true);
  };

  const handleSelectLeadToConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertLeadModalOpen(false);
    // Open client form pre-filled with lead data
    setIsAddClientModalOpen(true);
  };

  return (
    <div>
      <header className="mb-6 md:mb-8">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          Client Management
        </h1>
        <p className="text-[#7a7067]">
          Create a client area to manage info, send offers, and invoices.
        </p>
      </header>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search Client..."
            className="w-full pl-10 pr-4 py-3 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
            onChange={handleSearchChange}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a7067]" size={18} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-4 py-3 bg-white text-[#7a7067] rounded-lg border border-[#f5f0e8] hover:bg-[#f5f0e8] transition-colors flex items-center"
          >
            <FilterIcon className="h-5 w-5 mr-2" />
            Filters
            {isFilterOpen ? (
              <ChevronUpIcon className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            )}
          </button>

          <button
            onClick={handleRefresh}
            className="p-3 bg-white text-[#7a7067] rounded-lg border border-[#f5f0e8] hover:bg-[#f5f0e8] transition-colors"
            aria-label="Refresh client list"
          >
            <RefreshCwIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleOpenConvertLeadModal}
            className={`px-4 py-3 rounded-lg transition-colors flex items-center ${
              confirmedLeads.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#d4a5a5] text-white hover:bg-[#c99595]'
            }`}
            disabled={confirmedLeads.length === 0}
          >
            <LinkIcon className="h-5 w-5 mr-2" />
            Convert Lead
          </button>

          {/* Add New Client Button - Admin Only */}
          {isAdmin() && (
            <button
              onClick={handleAddClient}
              className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Client
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {isFilterOpen && (
        <div className="bg-white p-4 rounded-lg mb-6 border border-[#f5f0e8] animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Business Type Filter */}
            <div>
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Business Type
              </label>
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
              >
                <option value="">All Types</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setBusinessTypeFilter('');
                  setStatusFilter('');
                }}
                className="px-4 py-3 bg-[#f5f0e8] text-[#3a3226] rounded-lg hover:bg-[#ebe6de] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client List */}
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
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-[#7a7067]">
            <Users2Icon className="h-12 w-12 mb-4 text-[#d4a5a5]" />
            <p className="text-lg mb-2">No clients found</p>
            <p className="text-sm">
              {searchQuery || businessTypeFilter || statusFilter
                ? "Try adjusting your search or filters"
                : "Add your first client to get started"}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="w-full min-w-[1000px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 py-3 px-4 bg-[#f5f0e8] rounded-t-lg gap-2">
                  <div className="col-span-2 text-[#3a3226] font-medium text-sm">Company</div>
                  <div className="col-span-2 text-[#3a3226] font-medium text-sm">Client</div>
                  <div className="col-span-2 text-[#3a3226] font-medium text-sm">Email</div>
                  <div className="col-span-2 text-[#3a3226] font-medium text-sm">Due Date</div>
                  <div className="col-span-1 text-[#3a3226] font-medium text-sm">Handled by</div>
                  <div className="col-span-1 text-[#3a3226] font-medium text-sm">Progress</div>
                  <div className="col-span-1 text-[#3a3226] font-medium text-sm">Payment</div>
                  <div className="col-span-1 text-[#3a3226] font-medium text-sm text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div>
                  {filteredClients.map((client) => (
                    <div key={client.id}>
                      {/* Main Client Row - Clickable */}
                      <div
                        className={`grid grid-cols-12 py-4 px-4 cursor-pointer transition-colors border-b border-[#f5f0e8] ${expandedClientId === client.id ? 'bg-[#f9f6f1]' : 'bg-white'} items-center gap-2 min-h-[60px]`}
                        onClick={() => toggleExpandClient(client.id)}
                      >
                        {/* Company */}
                        <div className="col-span-2 flex items-center min-w-0">
                          <div className="mr-3 flex-shrink-0 w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center overflow-hidden">
                            {client.companyLogo ? (
                              <img src={client.companyLogo} alt={client.companyName} className="w-full h-full object-cover" />
                            ) : (
                              <BuildingIcon className="h-4 w-4 text-[#d4a5a5]" />
                            )}
                          </div>
                          <span className="text-[#3a3226] font-medium text-sm truncate">
                            {client.companyName}
                          </span>
                        </div>

                        {/* Client */}
                        <div className="col-span-2 text-[#3a3226] text-sm truncate">
                          {client.contactPersonName || 'Emma Chen'}
                        </div>

                        {/* Email */}
                        <div className="col-span-2 text-[#3a3226] text-sm truncate">
                          {client.email || 'hello@brownestcafe.com'}
                        </div>

                        {/* Due Date */}
                        <div className="col-span-2 text-[#3a3226] text-sm">
                          {client.dueDate || '10/05/2025'}
                        </div>

                        {/* Handled by */}
                        <div className="col-span-1 flex items-center min-w-0">
                          <Avatar
                            src={client.handledBy.avatar}
                            alt={client.handledBy.name}
                            size="xs"
                            className="mr-1 flex-shrink-0"
                          />
                          <span className="text-[#3a3226] text-xs truncate">
                            {client.handledBy.name}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="col-span-1">
                          <span className="inline-flex items-center">
                            <span className="h-2 w-2 rounded-full bg-[#d4a5a5] mr-1 flex-shrink-0"></span>
                            <span className="text-[#3a3226] text-xs">Planning</span>
                          </span>
                        </div>

                        {/* Payment */}
                        <div className="col-span-1">
                          <span className="inline-flex items-center">
                            <span className="h-2 w-2 rounded-full bg-[#d4a5a5] mr-1 flex-shrink-0"></span>
                            <span className="text-[#3a3226] text-xs">Pending</span>
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                            className="p-1.5 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded-full transition-colors"
                            aria-label="Edit client"
                          >
                            <EditIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client);
                            }}
                            className="p-1.5 text-[#7a7067] hover:text-[#d4a5a5] hover:bg-[#f5f0e8] rounded-full transition-colors"
                            aria-label="Delete client"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Client Details */}
                      {expandedClientId === client.id && (
                        <div className="bg-[#f8f4ee] border-b border-[#f5f0e8]">
                          <div className="p-6">
                            {/* Client Information Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                              {/* Contact Information Card */}
                              <div className="bg-white rounded-lg p-5 border border-[#f5f0e8] shadow-sm">
                                <div className="flex items-center mb-4">
                                  <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                                    <UserIcon className="h-4 w-4 text-[#d4a5a5]" />
                                  </div>
                                  <h3 className="text-[#3a3226] font-semibold text-base">Contact Information</h3>
                                </div>
                                <div className="space-y-3">
                                  {client.contactPersonName && (
                                    <div className="flex items-center">
                                      <UserIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-[#7a7067] uppercase tracking-wide">Contact Person</p>
                                        <p className="text-[#3a3226] text-sm font-medium">{client.contactPersonName}</p>
                                      </div>
                                    </div>
                                  )}
                                  {client.email && (
                                    <div className="flex items-center">
                                      <MailIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-[#7a7067] uppercase tracking-wide">Email</p>
                                        <p className="text-[#3a3226] text-sm font-medium break-all">{client.email}</p>
                                      </div>
                                    </div>
                                  )}
                                  {client.phoneNumber && (
                                    <div className="flex items-center">
                                      <PhoneIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-[#7a7067] uppercase tracking-wide">Phone</p>
                                        <p className="text-[#3a3226] text-sm font-medium">{client.phoneNumber}</p>
                                      </div>
                                    </div>
                                  )}
                                  {client.address && (
                                    <div className="flex items-start">
                                      <MapPinIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-[#7a7067] uppercase tracking-wide">Address</p>
                                        <p className="text-[#3a3226] text-sm font-medium leading-relaxed">{client.address}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Project Information Card */}
                              <div className="bg-white rounded-lg p-5 border border-[#f5f0e8] shadow-sm">
                                <div className="flex items-center mb-4">
                                  <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                                    <TagIcon className="h-4 w-4 text-[#d4a5a5]" />
                                  </div>
                                  <h3 className="text-[#3a3226] font-semibold text-base">Project Details</h3>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center">
                                    <BuildingIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-[#7a7067] uppercase tracking-wide">Business Type</p>
                                      <p className="text-[#3a3226] text-sm font-medium">{client.businessType || 'Not specified'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-[#7a7067] uppercase tracking-wide">Added On</p>
                                      <p className="text-[#3a3226] text-sm font-medium">
                                        {new Date(client.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <ClockIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-[#7a7067] uppercase tracking-wide">Status</p>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        client.status === 'Active'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {client.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <UserIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-[#7a7067] uppercase tracking-wide">Handled By</p>
                                      <div className="flex items-center mt-1">
                                        <Avatar
                                          src={client.handledBy.avatar}
                                          alt={client.handledBy.name}
                                          size="xs"
                                          className="mr-2"
                                        />
                                        <p className="text-[#3a3226] text-sm font-medium">{client.handledBy.name}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions Card */}
                              <div className="bg-white rounded-lg p-5 border border-[#f5f0e8] shadow-sm">
                                <div className="flex items-center mb-4">
                                  <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                                    <ExternalLinkIcon className="h-4 w-4 text-[#d4a5a5]" />
                                  </div>
                                  <h3 className="text-[#3a3226] font-semibold text-base">Quick Actions</h3>
                                </div>
                                <div className="space-y-3">
                                  <Link
                                    to={`/quotations/new?clientId=${client.id}`}
                                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium min-h-[44px]"
                                  >
                                    <FileTextIcon className="h-4 w-4 mr-2" />
                                    Create Quotation
                                  </Link>
                                  <Link
                                    to={`/invoices/new?clientId=${client.id}`}
                                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium min-h-[44px]"
                                  >
                                    <ReceiptIcon className="h-4 w-4 mr-2" />
                                    Create Invoice
                                  </Link>
                                </div>

                                {client.notes && (
                                  <div className="mt-4 pt-4 border-t border-[#f5f0e8]">
                                    <div className="flex items-start">
                                      <InfoIcon className="h-4 w-4 text-[#7a7067] mr-2 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-[#7a7067] uppercase tracking-wide mb-1">Notes</p>
                                        <p className="text-[#3a3226] text-sm leading-relaxed whitespace-pre-line">
                                          {client.notes}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tablet View */}
            <div className="hidden md:block lg:hidden">
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`${expandedClientId === client.id ? 'bg-[#f9f6f1]' : 'bg-white'} rounded-lg border border-[#f5f0e8] overflow-hidden shadow-sm`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleExpandClient(client.id)}
                    >
                      <div className="p-4 border-b border-[#f5f0e8] bg-white">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center">
                            <div className="mr-3 flex-shrink-0 w-10 h-10 bg-[#f5f0e8] rounded-full flex items-center justify-center">
                              <BuildingIcon className="h-5 w-5 text-[#d4a5a5]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#3a3226] font-medium text-base truncate">
                                {client.companyName}
                              </h3>
                              <p className="text-[#7a7067] text-sm">
                                {client.businessType}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {client.status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClient(client);
                              }}
                              className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded-full transition-colors min-h-[44px] min-w-[44px]"
                              aria-label="Edit client"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client);
                              }}
                              className="p-2 text-[#7a7067] hover:text-[#d4a5a5] hover:bg-[#f5f0e8] rounded-full transition-colors min-h-[44px] min-w-[44px]"
                              aria-label="Delete client"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {client.email && (
                              <div className="flex items-center text-[#3a3226] text-sm">
                                <MailIcon className="h-4 w-4 mr-2 text-[#7a7067] flex-shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.phoneNumber && (
                              <div className="flex items-center text-[#3a3226] text-sm">
                                <span className="inline-block w-4 h-4 mr-2 flex-shrink-0"></span>
                                <span className="truncate">{client.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Avatar
                                src={client.handledBy.avatar}
                                alt={client.handledBy.name}
                                size="xs"
                                className="mr-2 flex-shrink-0"
                              />
                              <span className="text-[#3a3226] text-sm truncate">
                                {client.handledBy.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-[#d4a5a5] mr-2 flex-shrink-0"></span>
                              <span className="text-[#3a3226] text-sm">Planning</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Client Details on Tablet */}
                    {expandedClientId === client.id && (
                      <div className="p-5 bg-[#f8f4ee] border-t border-[#f5f0e8]">
                        {/* Client Information Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                          {/* Contact & Project Information Card */}
                          <div className="bg-white rounded-lg p-4 border border-[#f5f0e8] shadow-sm">
                            <div className="flex items-center mb-4">
                              <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4 text-[#d4a5a5]" />
                              </div>
                              <h3 className="text-[#3a3226] font-semibold text-base">Client Information</h3>
                            </div>
                            <div className="space-y-3">
                              {client.contactPersonName && (
                                <div className="flex items-center">
                                  <UserIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-[#7a7067] uppercase tracking-wide">Contact Person</p>
                                    <p className="text-[#3a3226] text-sm font-medium">{client.contactPersonName}</p>
                                  </div>
                                </div>
                              )}
                              {client.phoneNumber && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-[#7a7067] uppercase tracking-wide">Phone</p>
                                    <p className="text-[#3a3226] text-sm font-medium">{client.phoneNumber}</p>
                                  </div>
                                </div>
                              )}
                              {client.address && (
                                <div className="flex items-start">
                                  <MapPinIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-[#7a7067] uppercase tracking-wide">Address</p>
                                    <p className="text-[#3a3226] text-sm font-medium leading-relaxed">{client.address}</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center">
                                <TagIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-[#7a7067] uppercase tracking-wide">Business Type</p>
                                  <p className="text-[#3a3226] text-sm font-medium">{client.businessType || 'Not specified'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Card */}
                          <div className="bg-white rounded-lg p-4 border border-[#f5f0e8] shadow-sm">
                            <div className="flex items-center mb-4">
                              <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                                <ExternalLinkIcon className="h-4 w-4 text-[#d4a5a5]" />
                              </div>
                              <h3 className="text-[#3a3226] font-semibold text-base">Quick Actions</h3>
                            </div>
                            <div className="space-y-3">
                              <Link
                                to={`/quotations/new?clientId=${client.id}`}
                                className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium min-h-[44px]"
                              >
                                <FileTextIcon className="h-4 w-4 mr-2" />
                                Create Quotation
                              </Link>
                              <Link
                                to={`/invoices/new?clientId=${client.id}`}
                                className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium min-h-[44px]"
                              >
                                <ReceiptIcon className="h-4 w-4 mr-2" />
                                Create Invoice
                              </Link>
                            </div>

                            {client.notes && (
                              <div className="mt-4 pt-4 border-t border-[#f5f0e8]">
                                <div className="flex items-start">
                                  <InfoIcon className="h-4 w-4 text-[#7a7067] mr-2 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-[#7a7067] uppercase tracking-wide mb-1">Notes</p>
                                    <p className="text-[#3a3226] text-sm leading-relaxed whitespace-pre-line">
                                      {client.notes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`${expandedClientId === client.id ? 'bg-[#f9f6f1]' : 'bg-white'} rounded-lg border border-[#f5f0e8] overflow-hidden shadow-sm`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpandClient(client.id)}
                  >
                    <div className="p-4 border-b border-[#f5f0e8] bg-white">
                      <div className="flex items-start mb-4">
                        <div className="mr-3 flex-shrink-0 w-12 h-12 bg-[#f5f0e8] rounded-full flex items-center justify-center">
                          <BuildingIcon className="h-6 w-6 text-[#d4a5a5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#3a3226] font-medium text-lg leading-tight mb-1">
                            {client.companyName}
                          </h3>
                          <p className="text-[#7a7067] text-sm mb-2">
                            {client.businessType}
                          </p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            client.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {client.email && (
                          <div className="flex items-center text-[#3a3226] text-sm min-h-[24px]">
                            <MailIcon className="h-4 w-4 mr-3 text-[#7a7067] flex-shrink-0" />
                            <span className="break-all">{client.email}</span>
                          </div>
                        )}
                        {client.phoneNumber && (
                          <div className="flex items-center text-[#3a3226] text-sm min-h-[24px]">
                            <span className="inline-block w-4 h-4 mr-3 flex-shrink-0"></span>
                            <span>{client.phoneNumber}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-start text-[#3a3226] text-sm">
                            <MapPinIcon className="h-4 w-4 mr-3 text-[#7a7067] mt-1 flex-shrink-0" />
                            <span className="flex-1 leading-relaxed">{client.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-[#f5f0e8] flex items-center justify-between min-h-[60px]">
                      <div className="flex items-center flex-1 min-w-0">
                        <Avatar
                          src={client.handledBy.avatar}
                          alt={client.handledBy.name}
                          size="sm"
                          className="mr-3 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[#3a3226] text-sm font-medium block truncate">
                            {client.handledBy.name}
                          </span>
                          <span className="text-[#7a7067] text-xs">
                            Handled by
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client);
                          }}
                          className="p-3 text-[#7a7067] hover:text-[#3a3226] hover:bg-white rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Edit client"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client);
                          }}
                          className="p-3 text-[#7a7067] hover:text-[#d4a5a5] hover:bg-white rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Delete client"
                        >
                          <Trash2Icon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Client Details on Mobile */}
                  {expandedClientId === client.id && (
                    <div className="p-4 bg-[#f8f4ee] border-t border-[#f5f0e8]">
                      {/* Client Information Card */}
                      <div className="bg-white rounded-lg p-4 border border-[#f5f0e8] shadow-sm mb-4">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                            <UserIcon className="h-4 w-4 text-[#d4a5a5]" />
                          </div>
                          <h3 className="text-[#3a3226] font-semibold text-base">Client Information</h3>
                        </div>
                        <div className="space-y-3">
                          {client.contactPersonName && (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-[#7a7067] uppercase tracking-wide">Contact Person</p>
                                <p className="text-[#3a3226] text-sm font-medium">{client.contactPersonName}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-[#7a7067] uppercase tracking-wide">Added On</p>
                              <p className="text-[#3a3226] text-sm font-medium">
                                {new Date(client.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <TagIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-[#7a7067] uppercase tracking-wide">Business Type</p>
                              <p className="text-[#3a3226] text-sm font-medium">{client.businessType || 'Not specified'}</p>
                            </div>
                          </div>
                          {client.notes && (
                            <div className="flex items-start">
                              <InfoIcon className="h-4 w-4 text-[#7a7067] mr-3 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-[#7a7067] uppercase tracking-wide">Notes</p>
                                <p className="text-[#3a3226] text-sm font-medium leading-relaxed whitespace-pre-line">
                                  {client.notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions Card */}
                      <div className="bg-white rounded-lg p-4 border border-[#f5f0e8] shadow-sm mb-4">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                            <ExternalLinkIcon className="h-4 w-4 text-[#d4a5a5]" />
                          </div>
                          <h3 className="text-[#3a3226] font-semibold text-base">Quick Actions</h3>
                        </div>
                        <div className="space-y-3">
                          <Link
                            to={`/quotations/new?clientId=${client.id}`}
                            className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium min-h-[44px]"
                          >
                            <FileTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            Create Quotation
                          </Link>
                          <Link
                            to={`/invoices/new?clientId=${client.id}`}
                            className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium min-h-[44px]"
                          >
                            <ReceiptIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            Create Invoice
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {isAddClientModalOpen && (
        <ClientForm
          onClose={() => {
            setIsAddClientModalOpen(false);
            setSelectedLead(null);
          }}
          onSubmit={addClient}
          initialLead={selectedLead}
        />
      )}

      {/* Edit Client Modal */}
      {isEditClientModalOpen && selectedClient && (
        <ClientForm
          onClose={() => {
            setIsEditClientModalOpen(false);
            setSelectedClient(null);
          }}
          onSubmit={(clientData) => updateClient(selectedClient.id, clientData)}
          initialClient={selectedClient}
          isEdit
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${selectedClient?.companyName}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />

      {/* Convert Lead Modal */}
      {isConvertLeadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#f5f0e8] px-6 py-4 border-b border-[#f5f0e8]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                    <LinkIcon className="h-5 w-5 text-[#d4a5a5]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xl text-[#3a3226]">Convert Lead to Client</h2>
                    <p className="text-sm text-[#7a7067]">Select a confirmed lead to convert</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConvertLeadModalOpen(false)}
                  className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-white rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {confirmedLeads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users2Icon className="h-8 w-8 text-[#d4a5a5]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#3a3226] mb-2">No Confirmed Leads</h3>
                  <p className="text-[#7a7067] mb-4">
                    No confirmed leads are currently available for conversion to clients.
                  </p>
                  <p className="text-sm text-[#7a7067]">
                    Leads must be in "Confirm" status to be converted to clients.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-[#3a3226] font-medium mb-1">
                      Available Confirmed Leads ({confirmedLeads.length})
                    </p>
                    <p className="text-sm text-[#7a7067]">
                      Click on a lead below to convert it to a client
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    <div className="space-y-3">
                      {confirmedLeads.map(lead => (
                        <div
                          key={lead.id}
                          className="bg-white border border-[#f5f0e8] rounded-lg overflow-hidden hover:border-[#d4a5a5] transition-colors"
                        >
                          <button
                            onClick={() => handleSelectLeadToConvert(lead)}
                            className="w-full text-left p-4 hover:bg-[#f9f6f1] transition-colors"
                          >
                            <div className="flex items-start">
                              <div className="w-12 h-12 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                <BuildingIcon className="h-6 w-6 text-[#d4a5a5]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold text-[#3a3226] text-base truncate">
                                    {lead.companyName}
                                  </h3>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 flex-shrink-0">
                                    Confirmed
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm text-[#7a7067]">
                                    <TagIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">{lead.businessType}</span>
                                  </div>
                                  {lead.email && (
                                    <div className="flex items-center text-sm text-[#7a7067]">
                                      <MailIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span className="truncate">{lead.email}</span>
                                    </div>
                                  )}
                                  {lead.phoneNumber && (
                                    <div className="flex items-center text-sm text-[#7a7067]">
                                      <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <span className="truncate">{lead.phoneNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <ExternalLinkIcon className="h-5 w-5 text-[#7a7067]" />
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {confirmedLeads.length > 0 && (
              <div className="bg-[#f9f6f1] px-6 py-4 border-t border-[#f5f0e8]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-[#7a7067]">
                    <InfoIcon className="h-4 w-4 mr-2" />
                    <span>Converting a lead will create a new client record</span>
                  </div>
                  <button
                    onClick={() => setIsConvertLeadModalOpen(false)}
                    className="px-4 py-2 text-[#7a7067] hover:text-[#3a3226] transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
