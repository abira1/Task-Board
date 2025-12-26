import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  Trash2Icon,
  Loader2Icon,
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
  CalendarIcon,
  Users2Icon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useLeads, Lead } from '../contexts/LeadContext';
import LeadForm from '../components/LeadForm';
import Avatar from '../components/Avatar';
import { debounce } from 'lodash';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LeadProgressDropdown from '../components/LeadProgressDropdown';

const LeadManagement = () => {
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const { leads, addLead, updateLead, updateLeadProgress, removeLead, loading, error, isConnected, refreshLeads } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [progressFilter, setProgressFilter] = useState<string>('');
  const [dateAddedFilter, setDateAddedFilter] = useState<string>('');
  const [handledByFilter, setHandledByFilter] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Business type options from LeadForm
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

  // Progress status options
  const progressStatuses = [
    'Untouched',
    'Knocked',
    'In Progress',
    'Confirm',
    'Canceled'
  ];

  // Extract unique team members who have handled leads
  const teamMembers = useMemo(() => {
    const uniqueMembers = new Set<string>();

    leads.forEach(lead => {
      if (lead.handledBy && lead.handledBy.name) {
        uniqueMembers.add(lead.handledBy.name);
      }
    });

    return Array.from(uniqueMembers).sort();
  }, [leads]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Filter leads based on search query and other filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Text search filter
      const matchesSearch = searchQuery === '' ||
        lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.businessType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contactPersonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.phoneNumber && lead.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.contactInfo && lead.contactInfo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        lead.progress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.handledBy.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Business type filter
      const matchesBusinessType = businessTypeFilter === '' ||
        lead.businessType === businessTypeFilter;

      // Progress status filter
      const matchesProgress = progressFilter === '' ||
        lead.progress === progressFilter;

      // Handled by filter
      const matchesHandledBy = handledByFilter === '' ||
        lead.handledBy.name === handledByFilter;

      // Date added filter (exact date match)
      let matchesDateAdded = true;
      if (dateAddedFilter) {
        const leadDate = new Date(lead.createdAt);
        const filterDate = new Date(dateAddedFilter);

        // Set both dates to midnight for date-only comparison
        leadDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        // Compare dates (year, month, day only)
        matchesDateAdded = leadDate.getTime() === filterDate.getTime();
      }

      // Return true only if all filters match
      return matchesSearch && matchesBusinessType && matchesProgress && matchesHandledBy && matchesDateAdded;
    });
  }, [leads, searchQuery, businessTypeFilter, progressFilter, handledByFilter, dateAddedFilter]);

  const handleAddLead = () => {
    // All users can add leads
    setIsAddLeadModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    // Check if user is admin or the creator of the lead
    const isCreator = lead.createdBy?.id === user?.id;

    if (!isAdmin() && !isCreator) {
      addNotification({
        title: 'Permission Denied',
        message: 'You can only edit leads you created',
        type: 'system'
      });
      return;
    }

    setSelectedLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleDeleteLead = (lead: Lead) => {
    if (!isAdmin()) {
      addNotification({
        title: 'Permission Denied',
        message: 'Only administrators can delete leads',
        type: 'system'
      });
      return;
    }
    setSelectedLead(lead);
    setIsConfirmDeleteOpen(true);
  };

  const toggleExpandLead = (leadId: string) => {
    setExpandedLeadId(currentId => currentId === leadId ? null : leadId);
  };

  const handleConvertToClient = (lead: Lead) => {
    // Client Management feature is currently not available
    addNotification({
      title: 'Feature Not Available',
      message: 'Client Management feature is currently not available',
      type: 'system'
    });
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setIsFilterOpen(prevState => !prevState);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setBusinessTypeFilter('');
    setProgressFilter('');
    setDateAddedFilter('');
    setHandledByFilter('');

    // Also clear the search input field value
    const searchInput = document.querySelector('input[placeholder="Search leads..."]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!selectedLead) return;

    // Double-check admin permissions before proceeding
    if (!isAdmin()) {
      addNotification({
        title: 'Permission Denied',
        message: 'Only administrators can delete leads',
        type: 'system'
      });
      setIsConfirmDeleteOpen(false);
      setSelectedLead(null);
      return;
    }

    setIsDeleting(true);

    try {
      // Call the removeLead function from the context
      await removeLead(selectedLead.id);

      // Show success notification
      await addNotification({
        title: 'Lead Deleted Successfully',
        message: `${selectedLead.companyName} has been permanently removed from leads`,
        type: 'task'
      });

      // Close modal and reset state
      setIsConfirmDeleteOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);

      // Show detailed error message
      let errorMessage = 'Failed to delete lead. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Permission denied')) {
          errorMessage = 'You do not have permission to delete this lead. Only administrators can delete leads.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'This lead could not be found. It may have been already deleted.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      await addNotification({
        title: 'Delete Failed',
        message: errorMessage,
        type: 'system'
      });
    } finally {
      setIsDeleting(false);
    }
  };



  return (
    <div>
      <header className="mb-6 md:mb-8">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          Lead Management
        </h1>
        <p className="text-[#7a7067]">
          Stay organized with all your lead info.
        </p>
      </header>

      <div className="bg-white rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-sm">
        {/* Connection Status Bar */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-[#f5eee8] rounded-lg flex items-center text-[#d4a5a5] text-sm">
            <WifiOffIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>You appear to be offline. Some features may be limited until your connection is restored.</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-[#f5eee8] rounded-lg flex items-center text-[#d4a5a5] text-sm">
            <AlertCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={refreshLeads}
              className="ml-auto bg-[#d4a5a5] text-white px-3 py-1.5 rounded-md text-xs flex items-center hover:bg-[#c99595] transition-colors"
              aria-label="Retry loading leads"
            >
              <RefreshCwIcon className="h-3 w-3 mr-1" />
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto md:flex-1">
            <div className="relative">
              <input
                type="text"
                className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border-0"
                placeholder="Search leads..."
                onChange={handleSearchChange}
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7a7067]" />
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <button
              onClick={toggleFilters}
              className={`flex items-center justify-center p-3 ${isFilterOpen ? 'bg-[#d4a5a5] text-white' : 'bg-[#f5f0e8] text-[#7a7067]'} rounded-lg hover:bg-[#d4a5a5] hover:text-white transition-colors`}
              title="Toggle filters"
              aria-label="Toggle filters"
              aria-expanded={isFilterOpen}
            >
              <FilterIcon className="h-5 w-5" />
            </button>
            <button
              className="flex items-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full md:w-auto justify-center"
              onClick={handleAddLead}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span>Add New Lead</span>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isFilterOpen ? 'max-h-[1000px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}
          aria-hidden={!isFilterOpen}
        >
          <div className="bg-[#f9f6f1] rounded-lg p-4 border border-[#f5f0e8]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h3 className="text-[#3a3226] font-medium flex items-center mb-3 md:mb-0">
                <FilterIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                Filter Leads
              </h3>
              <button
                onClick={clearFilters}
                className="text-[#7a7067] text-sm hover:text-[#d4a5a5] transition-colors flex items-center"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Business Type Filter */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Business Type
                </label>
                <select
                  value={businessTypeFilter}
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                  className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                >
                  <option value="">All Business Types</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Progress Status Filter */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Progress Status
                </label>
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                  className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                >
                  <option value="">All Statuses</option>
                  {progressStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Date Added Filter */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Date Added
                </label>
                <div className="relative">
                  <style>
                    {`
                      /* Hide default calendar icon in all browsers */
                      input[type="date"]::-webkit-calendar-picker-indicator {
                        display: none !important;
                        -webkit-appearance: none !important;
                        opacity: 0 !important;
                        width: 0 !important;
                        height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                      }
                      input[type="date"]::-webkit-inner-spin-button,
                      input[type="date"]::-webkit-outer-spin-button {
                        -webkit-appearance: none !important;
                        margin: 0 !important;
                      }
                      input[type="date"]::-moz-calendar-picker-indicator {
                        display: none !important;
                      }
                      input[type="date"] {
                        -moz-appearance: none !important;
                        -webkit-appearance: none !important;
                      }
                    `}
                  </style>
                  <input
                    type="date"
                    value={dateAddedFilter}
                    onChange={(e) => setDateAddedFilter(e.target.value)}
                    className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8] appearance-none"
                    style={{ colorScheme: 'normal' }}
                  />
                  {/* Custom calendar icon with Toiral design system colors */}
                  <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center pointer-events-none bg-white rounded-r-lg">
                    <CalendarIcon className="h-5 w-5 text-[#7a7067]" />
                  </div>
                </div>
              </div>

              {/* Handled By Filter */}
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Handled By
                </label>
                <select
                  value={handledByFilter}
                  onChange={(e) => setHandledByFilter(e.target.value)}
                  className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                >
                  <option value="">All Team Members</option>
                  {teamMembers.map((member) => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <Loader2Icon className="h-10 w-10 text-[#d4a5a5] animate-spin mb-4" />
            <p className="text-[#7a7067] text-center">Loading leads...</p>
            <p className="text-[#7a7067] text-sm text-center mt-1">This may take a moment</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[#f5f0e8] inline-flex rounded-full p-4 mb-4">
              <BuildingIcon className="h-8 w-8 text-[#d4a5a5]" />
            </div>
            <h3 className="text-[#3a3226] font-medium text-lg mb-2">No leads found</h3>
            {searchQuery ? (
              <div>
                <p className="text-[#7a7067] mb-4">No leads match your search criteria. Try adjusting your search or clear it to see all leads.</p>
                <button
                  className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg"
                  onClick={() => debouncedSearch('')}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[#7a7067] mb-4">Get started by adding your first lead to the system.</p>
                <button
                  className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg"
                  onClick={handleAddLead}
                >
                  Add your first lead
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <div className="w-full bg-white rounded-lg">
                {/* Table Header */}
                <div className="grid grid-cols-12 border-b border-[#f5f0e8] py-3 px-4">
                  <div className="col-span-3 text-[#3a3226] font-medium flex items-center">
                    <BuildingIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                    Company name
                  </div>
                  <div className="col-span-2 text-[#3a3226] font-medium">Type</div>
                  <div className="col-span-3 text-[#3a3226] font-medium flex items-center">
                    <MailIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                    Contact Details
                  </div>
                  <div className="col-span-2 text-[#3a3226] font-medium">Handled By</div>
                  <div className="col-span-2 text-[#3a3226] font-medium">Progress</div>
                </div>

                {/* Table Body */}
                <div>
                  {filteredLeads.map((lead) => (
                    <div key={lead.id}>
                      {/* Main Lead Row - Clickable */}
                      <div
                        className={`grid grid-cols-12 py-4 px-4 cursor-pointer transition-colors border-b border-[#f5f0e8] ${expandedLeadId === lead.id ? 'bg-[#f9f6f1]' : 'bg-white'} items-center`}
                        onClick={() => toggleExpandLead(lead.id)}
                      >
                        <div className="col-span-3 flex items-center">
                          <div className="mr-3 flex-shrink-0 w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center">
                            <BuildingIcon className="h-4 w-4 text-[#d4a5a5]" />
                          </div>
                          <div>
                            <span className="text-[#3a3226] font-medium block">
                              {lead.companyName}
                            </span>
                            {lead.location && (
                              <span className="text-[#7a7067] text-xs flex items-center mt-1">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                {lead.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="text-[#7a7067] px-2 py-1 bg-[#f5f0e8] rounded-md text-xs inline-block">
                            {lead.businessType || 'N/A'}
                          </span>
                        </div>

                        <div className="col-span-3">
                          <div className="flex flex-col">
                            <span className="text-[#3a3226] text-sm font-medium">
                              {lead.contactPersonName || 'No contact name'}
                            </span>
                            {lead.email && (
                              <span className="text-[#7a7067] text-xs mt-1 flex items-center">
                                <MailIcon className="h-3 w-3 mr-1" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phoneNumber && (
                              <span className="text-[#7a7067] text-xs mt-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                {lead.phoneNumber}
                              </span>
                            )}
                            {!lead.email && !lead.phoneNumber && lead.contactInfo && (
                              <span className="text-[#7a7067] text-xs mt-1">
                                {lead.contactInfo}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center">
                            <Avatar
                              src={lead.handledBy.avatar}
                              alt={lead.handledBy.name}
                              className="mr-2"
                              size="sm"
                            />
                            <span className="text-[#3a3226] text-sm">
                              {lead.handledBy.name}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-between">
                          <LeadProgressDropdown
                            lead={lead}
                            onProgressUpdate={updateLeadProgress}
                          />

                          <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                            {/* Show convert button for confirmed leads */}
                            {lead.progress === 'Confirm' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConvertToClient(lead);
                                }}
                                className="p-2 text-[#7a7067] hover:text-[#3a3226] bg-[#f5f0e8] hover:bg-[#ebe6de] rounded-lg transition-colors"
                                title="Convert to client"
                                aria-label="Convert to client"
                              >
                                <Users2Icon className="h-4 w-4" />
                              </button>
                            )}

                            {/* Show edit button if user is admin or creator of the lead */}
                            {(isAdmin() || lead.createdBy?.id === user?.id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLead(lead);
                                }}
                                className="p-2 text-[#7a7067] hover:text-[#3a3226] bg-[#f5f0e8] hover:bg-[#ebe6de] rounded-lg transition-colors"
                                title="Edit lead"
                                aria-label="Edit lead"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                            )}

                            {/* Show delete button only for admins */}
                            {isAdmin() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLead(lead);
                                }}
                                className="p-2 text-[#7a7067] hover:text-[#d4a5a5] bg-[#f5f0e8] hover:bg-[#f5eee8] rounded-lg transition-colors"
                                title="Delete lead"
                                aria-label="Delete lead"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Section */}
                      {expandedLeadId === lead.id && (
                        <div className="px-6 py-5 border-b border-[#f5f0e8] animate-fadeIn">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#3a3226] font-medium text-lg flex items-center">
                              <UserIcon className="h-5 w-5 mr-2 text-[#d4a5a5]" />
                              Lead Details
                            </h3>
                            <div className="text-xs text-[#7a7067]">
                              Created: {new Date(lead.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-lg border border-[#f5f0e8]">
                              <h4 className="text-[#3a3226] font-medium mb-3 pb-2 border-b border-[#f5f0e8] flex items-center">
                                <BuildingIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                Company Information
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <div className="text-[#7a7067] text-xs mb-1">Company Name</div>
                                  <div className="text-[#3a3226] font-medium">{lead.companyName}</div>
                                </div>

                                <div>
                                  <div className="text-[#7a7067] text-xs mb-1">Business Type</div>
                                  <div className="text-[#3a3226]">{lead.businessType || 'Not specified'}</div>
                                </div>

                                {lead.location && (
                                  <div>
                                    <div className="text-[#7a7067] text-xs mb-1">Location</div>
                                    <div className="text-[#3a3226] flex items-center">
                                      <MapPinIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                      {lead.location}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-[#f5f0e8]">
                              <h4 className="text-[#3a3226] font-medium mb-3 pb-2 border-b border-[#f5f0e8] flex items-center">
                                <UserIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                Contact Information
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <div className="text-[#7a7067] text-xs mb-1">Contact Person</div>
                                  <div className="text-[#3a3226] font-medium">{lead.contactPersonName || 'Not specified'}</div>
                                </div>

                                {lead.email && (
                                  <div>
                                    <div className="text-[#7a7067] text-xs mb-1">Email</div>
                                    <div className="text-[#3a3226] flex items-center">
                                      <MailIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                      {lead.email}
                                    </div>
                                  </div>
                                )}

                                {lead.phoneNumber && (
                                  <div>
                                    <div className="text-[#7a7067] text-xs mb-1">Phone</div>
                                    <div className="text-[#3a3226] flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-[#d4a5a5]">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                      </svg>
                                      {lead.phoneNumber}
                                    </div>
                                  </div>
                                )}

                                {!lead.email && !lead.phoneNumber && lead.contactInfo && (
                                  <div>
                                    <div className="text-[#7a7067] text-xs mb-1">Contact Info</div>
                                    <div className="text-[#3a3226] flex items-center">
                                      <MailIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                      {lead.contactInfo}
                                    </div>
                                  </div>
                                )}

                                {lead.socialMedia && (
                                  <div>
                                    <div className="text-[#7a7067] text-xs mb-1">Social Media</div>
                                    <a
                                      href={lead.socialMedia.startsWith('http') ? lead.socialMedia : `https://${lead.socialMedia}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#3a3226] flex items-center hover:text-[#d4a5a5]"
                                    >
                                      <LinkIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                      <span className="truncate">{lead.socialMedia}</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-[#f5f0e8]">
                              <h4 className="text-[#3a3226] font-medium mb-3 pb-2 border-b border-[#f5f0e8]">Notes</h4>
                              <p className="text-[#7a7067] whitespace-pre-line">
                                {lead.notes || 'No additional notes available for this lead.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`${expandedLeadId === lead.id ? 'bg-[#f9f6f1]' : 'bg-white'} rounded-lg border border-[#f5f0e8] overflow-hidden shadow-sm`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpandLead(lead.id)}
                  >
                    <div className="p-4 border-b border-[#f5f0e8] bg-white">
                      <div className="flex items-center mb-3">
                        <div className="mr-3 flex-shrink-0 w-10 h-10 bg-[#f5f0e8] rounded-full flex items-center justify-center">
                          <BuildingIcon className="h-5 w-5 text-[#d4a5a5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#3a3226] font-medium text-base truncate">
                            {lead.companyName}
                          </h3>
                          {lead.location && (
                            <p className="text-[#7a7067] text-xs flex items-center mt-1">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {lead.location}
                            </p>
                          )}
                        </div>
                        <div className="ml-2">
                          <LeadProgressDropdown
                            lead={lead}
                            onProgressUpdate={updateLeadProgress}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 mt-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                            <UserIcon className="h-4 w-4 text-[#d4a5a5]" />
                          </div>
                          <div>
                            <div className="text-[#7a7067] text-xs">Contact</div>
                            <div className="text-[#3a3226] text-sm font-medium">{lead.contactPersonName || 'No contact name'}</div>
                          </div>
                        </div>

                        {lead.email && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                              <MailIcon className="h-4 w-4 text-[#d4a5a5]" />
                            </div>
                            <div>
                              <div className="text-[#7a7067] text-xs">Email</div>
                              <div className="text-[#3a3226] text-sm break-words">{lead.email}</div>
                            </div>
                          </div>
                        )}

                        {lead.phoneNumber && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a5a5]">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                            </div>
                            <div>
                              <div className="text-[#7a7067] text-xs">Phone</div>
                              <div className="text-[#3a3226] text-sm break-words">{lead.phoneNumber}</div>
                            </div>
                          </div>
                        )}

                        {!lead.email && !lead.phoneNumber && lead.contactInfo && (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                              <MailIcon className="h-4 w-4 text-[#d4a5a5]" />
                            </div>
                            <div>
                              <div className="text-[#7a7067] text-xs">Contact Info</div>
                              <div className="text-[#3a3226] text-sm break-words">{lead.contactInfo}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                            <Avatar
                              src={lead.handledBy.avatar}
                              alt={lead.handledBy.name}
                              className=""
                              size="xs"
                            />
                          </div>
                          <div>
                            <div className="text-[#7a7067] text-xs">Handled by</div>
                            <div className="text-[#3a3226] text-sm">{lead.handledBy.name}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex border-t border-[#f5f0e8] bg-white">
                      <button
                        className="flex-1 py-3 text-center text-[#7a7067] flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandLead(lead.id);
                        }}
                      >
                        {expandedLeadId === lead.id ? (
                          <>
                            <ChevronUpIcon className="h-4 w-4 mr-1" />
                            <span>Hide details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="h-4 w-4 mr-1" />
                            <span>View details</span>
                          </>
                        )}
                      </button>

                      <div className="flex border-l border-[#f5f0e8]">
                        {/* Show convert button for confirmed leads */}
                        {lead.progress === 'Confirm' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToClient(lead);
                            }}
                            className="p-3 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] transition-colors"
                            title="Convert to client"
                            aria-label="Convert to client"
                          >
                            <Users2Icon className="h-5 w-5" />
                          </button>
                        )}

                        {/* Show edit button if user is admin or creator of the lead */}
                        {(isAdmin() || lead.createdBy?.id === user?.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLead(lead);
                            }}
                            className="p-3 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] transition-colors border-l border-[#f5f0e8]"
                            title="Edit lead"
                            aria-label="Edit lead"
                          >
                            <EditIcon className="h-5 w-5" />
                          </button>
                        )}

                        {/* Show delete button only for admins */}
                        {isAdmin() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLead(lead);
                            }}
                            className="p-3 text-[#7a7067] hover:text-[#d4a5a5] hover:bg-[#f5f0e8] transition-colors border-l border-[#f5f0e8]"
                            title="Delete lead"
                            aria-label="Delete lead"
                          >
                            <Trash2Icon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Section for Mobile */}
                  {expandedLeadId === lead.id && (
                    <div className="p-4 border-t border-[#f5f0e8] animate-fadeIn">
                      <div className="mb-3 pb-3 border-b border-[#f5f0e8]">
                        <div className="text-xs text-[#7a7067] mb-1">Created</div>
                        <div className="text-sm text-[#3a3226]">{new Date(lead.createdAt).toLocaleDateString()}</div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-3 rounded-lg border border-[#f5f0e8]">
                          <h3 className="text-[#3a3226] font-medium text-sm mb-2 flex items-center">
                            <BuildingIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                            Company Information
                          </h3>

                          <div className="space-y-2">
                            <div>
                              <div className="text-[#7a7067] text-xs">Business Type</div>
                              <div className="text-[#3a3226] text-sm">{lead.businessType || 'Not specified'}</div>
                            </div>

                            {lead.location && (
                              <div>
                                <div className="text-[#7a7067] text-xs">Location</div>
                                <div className="text-[#3a3226] text-sm flex items-center">
                                  <MapPinIcon className="h-3 w-3 mr-1 text-[#d4a5a5]" />
                                  {lead.location}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-[#f5f0e8]">
                          <h3 className="text-[#3a3226] font-medium text-sm mb-2 flex items-center">
                            <UserIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                            Contact Details
                          </h3>

                          <div className="space-y-2">
                            <div>
                              <div className="text-[#7a7067] text-xs">Contact Person</div>
                              <div className="text-[#3a3226] text-sm">{lead.contactPersonName || 'Not specified'}</div>
                            </div>

                            {lead.email && (
                              <div>
                                <div className="text-[#7a7067] text-xs">Email</div>
                                <div className="text-[#3a3226] text-sm">{lead.email}</div>
                              </div>
                            )}

                            {lead.phoneNumber && (
                              <div>
                                <div className="text-[#7a7067] text-xs">Phone</div>
                                <div className="text-[#3a3226] text-sm">{lead.phoneNumber}</div>
                              </div>
                            )}

                            {!lead.email && !lead.phoneNumber && lead.contactInfo && (
                              <div>
                                <div className="text-[#7a7067] text-xs">Contact Info</div>
                                <div className="text-[#3a3226] text-sm">{lead.contactInfo}</div>
                              </div>
                            )}

                            {lead.socialMedia && (
                              <div>
                                <div className="text-[#7a7067] text-xs">Social Media</div>
                                <a
                                  href={lead.socialMedia.startsWith('http') ? lead.socialMedia : `https://${lead.socialMedia}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#3a3226] text-sm flex items-center hover:text-[#d4a5a5]"
                                >
                                  <LinkIcon className="h-3 w-3 mr-1 text-[#d4a5a5]" />
                                  <span className="break-all">{lead.socialMedia}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {lead.notes && (
                          <div className="bg-white p-3 rounded-lg border border-[#f5f0e8]">
                            <h3 className="text-[#3a3226] font-medium text-sm mb-2">Notes</h3>
                            <p className="text-[#7a7067] text-sm whitespace-pre-line">
                              {lead.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddLeadModalOpen && (
        <LeadForm
          onClose={() => setIsAddLeadModalOpen(false)}
          onSubmit={addLead}
        />
      )}

      {/* Edit Lead Modal */}
      {isEditLeadModalOpen && selectedLead && (
        <LeadForm
          onClose={() => {
            setIsEditLeadModalOpen(false);
            setSelectedLead(null);
          }}
          onSubmit={(leadData) => updateLead(selectedLead.id, leadData)}
          initialLead={selectedLead}
          isEdit
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete the lead for ${selectedLead?.companyName}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Lead"}
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default LeadManagement;
