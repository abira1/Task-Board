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
  LinkIcon
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
  const { leads, addLead, updateLead, removeLead, loading } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

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

    try {
      await removeLead(selectedLead.id);

      await addNotification({
        title: 'Lead Removed',
        message: `${selectedLead.companyName} has been removed from leads`,
        type: 'task'
      });

      setIsConfirmDeleteOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);

      await addNotification({
        title: 'Error',
        message: 'Failed to delete lead. Please try again.',
        type: 'system'
      });
    }
  };

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'In Progress':
        return 'bg-[#f0f0e8] text-[#b8b87e]';
      case 'Untouched':
        return 'bg-[#e8f3f1] text-[#7eb8ab]';
      case 'Closed':
        return 'bg-[#f5eee8] text-[#d4a5a5]';
      default:
        return 'bg-[#f5f0e8] text-[#7a7067]';
    }
  };

  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case 'In Progress':
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'Untouched':
        return <XCircleIcon className="h-4 w-4 mr-1" />;
      case 'Closed':
        return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
          Lead Management
        </h1>
        <p className="text-[#7a7067]">
          Stay organized with all your lead info.
        </p>
      </header>

      <div className="bg-white rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto md:flex-1">
            <input
              type="text"
              className="bg-[#f5f0e8] text-[#3a3226] w-full pl-4 pr-4 py-3 rounded-lg focus:outline-none border-0"
              placeholder="Search leads..."
              onChange={handleSearchChange}
            />
          </div>
          <button
            className="flex items-center px-4 py-2 bg-[#d4a5a5] text-white rounded-lg w-full md:w-auto justify-center"
            onClick={handleAddLead}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span>Add New Lead</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#7a7067] mb-4">No leads found</p>
            <button
              className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg"
              onClick={handleAddLead}
            >
              Add your first lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="w-full bg-white rounded-lg">
              {/* Table Header */}
              <div className="grid grid-cols-5 border-b border-[#f5f0e8] py-3 px-4">
                <div className="text-[#3a3226] font-medium">Company name</div>
                <div className="text-[#3a3226] font-medium">Type</div>
                <div className="text-[#3a3226] font-medium">Contact Details</div>
                <div className="text-[#3a3226] font-medium">Handled By</div>
                <div className="text-[#3a3226] font-medium">Progress</div>
              </div>

              {/* Table Body */}
              <div>
                {filteredLeads.map((lead, index) => (
                  <div key={lead.id}>
                    {/* Main Lead Row - Clickable */}
                    <div
                      className={`grid grid-cols-5 py-4 px-4 cursor-pointer hover:bg-[#f9f6f1] transition-colors border-b border-[#f5f0e8] ${index % 2 === 0 ? 'bg-[#f9f6f1]' : 'bg-white'}`}
                      onClick={() => toggleExpandLead(lead.id)}
                    >
                      <div>
                        <span className="text-[#3a3226] font-medium">
                          {lead.companyName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7a7067]">
                          {lead.businessType || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7a7067]">
                          {lead.email}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <Avatar
                            src={lead.handledBy.avatar}
                            alt={lead.handledBy.name}
                            className="mr-3"
                            size="sm"
                          />
                          <span className="text-[#3a3226]">
                            {lead.handledBy.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getProgressColor(lead.progress)}`}>
                          {getProgressIcon(lead.progress)}
                          {lead.progress}
                        </span>

                        <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                          {/* Show edit button if user is admin or creator of the lead */}
                          {(isAdmin() || lead.createdBy?.id === user?.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLead(lead);
                              }}
                              className="p-1 text-[#7a7067] hover:text-[#3a3226]"
                              title="Edit lead"
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
                              className="p-1 text-[#7a7067] hover:text-[#d4a5a5]"
                              title="Delete lead"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    {expandedLeadId === lead.id && (
                      <div className="px-6 py-4 bg-[#f9f6f1] border-b border-[#f5f0e8]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-[#3a3226] font-medium mb-2">Contact Person Name</h3>
                            <p className="text-[#7a7067]">{lead.contactPersonName || 'Not specified'}</p>
                          </div>

                          {lead.socialMedia && (
                            <div>
                              <h3 className="text-[#3a3226] font-medium mb-2">Social Media</h3>
                              <a
                                href={lead.socialMedia.startsWith('http') ? lead.socialMedia : `https://${lead.socialMedia}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7a7067] flex items-center hover:text-[#d4a5a5]"
                              >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                <span>{lead.socialMedia}</span>
                              </a>
                            </div>
                          )}

                          {lead.location && (
                            <div>
                              <h3 className="text-[#3a3226] font-medium mb-2">Location</h3>
                              <p className="text-[#7a7067] flex items-center">
                                <span className="inline-block mr-2">📍</span>
                                {lead.location}
                              </p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-[#3a3226] font-medium mb-2">Full Name</h3>
                            <p className="text-[#7a7067]">{lead.fullName}</p>
                          </div>

                          <div className="md:col-span-2">
                            <h3 className="text-[#3a3226] font-medium mb-2">Notes</h3>
                            <p className="text-[#7a7067]">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl text-[#3a3226] mb-4">Confirm Delete</h2>
            <p className="text-[#7a7067] mb-6">
              Are you sure you want to delete the lead for <strong>{selectedLead.companyName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 text-[#7a7067] bg-[#f5f0e8] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
