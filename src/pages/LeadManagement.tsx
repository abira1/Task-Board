import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  Trash2Icon,
  Loader2Icon,
  CheckCircleIcon,
  ClockIcon,
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
  ChevronUpIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useLeads, Lead } from '../contexts/LeadContext';
import LeadForm from '../components/LeadForm';
import Avatar from '../components/Avatar';
import { debounce } from 'lodash';

const LeadManagement = () => {
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const { leads, addLead, updateLead, removeLead, loading, error, isConnected, refreshLeads } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Filter leads based on search query
  const filteredLeads = useMemo(() => {
    return leads.filter(lead =>
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.businessType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPersonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.progress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.handledBy.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

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

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'Untouched':
        return 'bg-[#e8f3f1] text-[#7eb8ab]';
      case 'Knocked':
        return 'bg-[#f0f0e8] text-[#b8b87e]';
      case 'In Progress':
        return 'bg-[#f0f0e8] text-[#b8b87e]';
      case 'Confirm':
        return 'bg-[#f5eee8] text-[#d4a5a5]';
      case 'Canceled':
        return 'bg-[#f8e8e8] text-[#e57373]';
      default:
        return 'bg-[#f5f0e8] text-[#7a7067]';
    }
  };

  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case 'Untouched':
        return <XCircleIcon className="h-4 w-4 mr-1" />;
      case 'Knocked':
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'In Progress':
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'Confirm':
        return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case 'Canceled':
        return <XIcon className="h-4 w-4 mr-1" />;
      default:
        return null;
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
              onClick={refreshLeads}
              className="flex items-center justify-center p-3 bg-[#f5f0e8] text-[#7a7067] rounded-lg hover:bg-[#ebe6de] transition-colors"
              title="Refresh leads"
              aria-label="Refresh leads"
            >
              <RefreshCwIcon className="h-5 w-5" />
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
                  {filteredLeads.map((lead, index) => (
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
                            <span className="text-[#7a7067] text-xs mt-1">
                              {lead.contactInfo}
                            </span>
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
                          <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getProgressColor(lead.progress)}`}>
                            {getProgressIcon(lead.progress)}
                            {lead.progress}
                          </span>

                          <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
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

                                <div>
                                  <div className="text-[#7a7067] text-xs mb-1">Contact Info</div>
                                  <div className="text-[#3a3226] flex items-center">
                                    <MailIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                                    {lead.contactInfo}
                                  </div>
                                </div>

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
              {filteredLeads.map((lead, index) => (
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
                        <span className={`ml-2 px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getProgressColor(lead.progress)}`}>
                          {getProgressIcon(lead.progress)}
                          {lead.progress}
                        </span>
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

                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#f5f0e8] rounded-full flex items-center justify-center mr-3">
                            <MailIcon className="h-4 w-4 text-[#d4a5a5]" />
                          </div>
                          <div>
                            <div className="text-[#7a7067] text-xs">Contact Info</div>
                            <div className="text-[#3a3226] text-sm break-words">{lead.contactInfo}</div>
                          </div>
                        </div>

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
                        {/* Show edit button if user is admin or creator of the lead */}
                        {(isAdmin() || lead.createdBy?.id === user?.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLead(lead);
                            }}
                            className="p-3 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] transition-colors"
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

                            <div>
                              <div className="text-[#7a7067] text-xs">Contact Info</div>
                              <div className="text-[#3a3226] text-sm">{lead.contactInfo}</div>
                            </div>

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
      {isConfirmDeleteOpen && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-md p-5 md:p-6 shadow-lg animate-scaleIn">
            <div className="flex items-start mb-5">
              <div className="bg-[#f5eee8] p-3 rounded-full mr-4 flex-shrink-0">
                <Trash2Icon className="h-6 w-6 text-[#d4a5a5]" />
              </div>
              <div>
                <h2 className="text-xl text-[#3a3226] font-medium mb-2">Confirm Delete</h2>
                <p className="text-[#7a7067]">
                  Are you sure you want to delete the lead for <span className="font-medium text-[#3a3226]">{selectedLead.companyName}</span>?
                </p>
                <p className="text-[#d4a5a5] text-sm mt-2 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => !isDeleting && setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067] disabled:opacity-50"
                aria-label="Close dialog"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 p-4 bg-[#f9f6f1] rounded-lg mb-5">
              <div className="flex items-center mb-2">
                <span className="text-[#7a7067] w-24 flex-shrink-0 text-sm">Company:</span>
                <span className="text-[#3a3226] font-medium">{selectedLead.companyName}</span>
              </div>
              <div className="flex items-center mb-2">
                <span className="text-[#7a7067] w-24 flex-shrink-0 text-sm">Contact:</span>
                <span className="text-[#3a3226]">{selectedLead.contactPersonName || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-[#7a7067] w-24 flex-shrink-0 text-sm">Contact Info:</span>
                <span className="text-[#3a3226]">{selectedLead.contactInfo}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => !isDeleting && setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
                className="px-4 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-2 sm:order-1 hover:bg-[#ebe6de] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto order-1 sm:order-2 hover:bg-[#c99595] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Lead'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
