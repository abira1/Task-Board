import React, { useState, useEffect } from 'react';
import { XIcon, Loader2Icon, AlertCircleIcon, UserIcon } from 'lucide-react';
import { fetchData } from '../firebase/database';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';

// Define Task interface
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  assignee: {
    name: string;
    avatar: string;
  };
  assignees?: Array<{
    name: string;
    avatar: string;
  }>;
  progress?: number;
}

// Define User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

interface TaskFormProps {
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'todo' | 'inProgress' | 'done';
    dueDate?: Date;
    assignee: {
      name: string;
      avatar: string;
    };
    assignees?: Array<{
      name: string;
      avatar: string;
    }>;
    assignmentMode?: 'single' | 'multiple';
  }) => void;
  initialStatus?: 'todo' | 'inProgress' | 'done';
  initialTask?: Task;
}

const TaskForm: React.FC<TaskFormProps> = ({
  onClose,
  onSubmit,
  initialStatus = 'todo',
  initialTask
}) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>(initialTask?.priority || 'Medium');
  const [status, setStatus] = useState<'todo' | 'inProgress' | 'done'>(initialTask?.status || initialStatus);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ? new Date(initialTask.dueDate).toISOString().split('T')[0] : '');
  const [assignee, setAssignee] = useState(initialTask?.assignee.name || '');
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'multiple'>(
    initialTask?.assignees && initialTask.assignees.length > 0 ? 'multiple' : 'single'
  );
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    initialTask?.assignees ? initialTask.assignees.map(a => a.name) : []
  );
  const { user, isAdmin } = useAuth();

  // State for team members
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
  const [teamMemberError, setTeamMemberError] = useState<string | null>(null);

  // Get selected team member
  const selectedMember = teamMembers.find(member => member.name === assignee);

  // Fetch team members from Firebase
  useEffect(() => {
    setTeamMemberError(null);

    const unsubscribe = fetchData<User[]>('users', (data) => {
      try {
        if (data) {
          // Filter to include all approved users, including admins
          // Make sure to include all admin users regardless of approval status
          const approvedUsers = data.filter(user =>
            user.approvalStatus === 'approved' || user.role === 'admin'
          );

          // Log the users to help with debugging
          console.log('All users:', data);
          console.log('Approved users:', approvedUsers);
          console.log('Admin users:', approvedUsers.filter(user => user.role === 'admin'));
          console.log('Current user:', user?.name, user?.role, user?.approvalStatus);

          if (approvedUsers.length === 0) {
            setTeamMemberError('No approved team members found. Please contact your administrator.');
          }

          setTeamMembers(approvedUsers);

          // If editing a task and the assignee is not in the approved users list,
          // add them temporarily to the list to maintain data integrity
          if (initialTask?.assignee.name &&
              !approvedUsers.some(user => user.name === initialTask.assignee.name)) {

            setTeamMembers(prev => [
              ...prev,
              {
                id: 'temp-' + Date.now(),
                name: initialTask.assignee.name,
                email: '',
                role: 'team_member',
                avatar: initialTask.assignee.avatar,
                approvalStatus: 'approved'
              }
            ]);
          }
        } else {
          setTeamMembers([]);
          setTeamMemberError('Unable to load team members. Please try again later.');
        }
      } catch (error) {
        console.error('Error processing team members:', error);
        setTeamMemberError('An error occurred while loading team members.');
      } finally {
        setLoadingTeamMembers(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (assignmentMode === 'single') {
      // Find the selected team member for single assignment
      const selectedMember = teamMembers.find(member => member.name === assignee);

      if (!selectedMember && assignee) {
        alert('Please select a valid team member');
        return;
      }

      onSubmit({
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignee: selectedMember ? {
          name: selectedMember.name,
          avatar: selectedMember.avatar || ''
        } : {
          name: 'Unassigned',
          avatar: ''
        },
        assignmentMode: 'single'
      });
    } else {
      // Handle multiple assignees
      if (selectedAssignees.length === 0) {
        alert('Please select at least one team member');
        return;
      }

      const assigneesData = selectedAssignees.map(name => {
        const member = teamMembers.find(m => m.name === name);
        return {
          name: member?.name || name,
          avatar: member?.avatar || ''
        };
      });

      // Set the first assignee as the primary assignee for backward compatibility
      onSubmit({
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignee: assigneesData[0],
        assignees: assigneesData,
        assignmentMode: 'multiple'
      });
    }
    
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[480px] md:max-w-[850px] md:rounded-xl flex flex-col">
        {/* Modal Header with sticky positioning */}
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-[#f5f0e8] flex justify-between items-center z-20 shadow-sm">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            {initialTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226] transition-colors"
            aria-label="Close form"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-grow overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit}>
            {/* Desktop Layout - Two Column Structure */}
            <div className="md:flex md:gap-8">
              {/* Left Column - Main Task Information */}
              <div className="md:flex-1 space-y-5">
                {/* Task Basic Information Section */}
                <div className="p-4 md:p-5 bg-[#f9f6f1] rounded-lg mb-6">
                  <h3 className="text-[#3a3226] font-medium mb-4 text-lg">Task Information</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[#3a3226] text-sm font-medium mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                        placeholder="Enter task title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[#3a3226] text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[180px] border border-[#f5f0e8]"
                        placeholder="Enter task description"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Task Details and Settings */}
              <div className="md:w-[280px] space-y-5">
                {/* Task Status Section */}
                <div className="p-4 md:p-5 bg-[#f9f6f1] rounded-lg mb-6">
                  <h3 className="text-[#3a3226] font-medium mb-4 text-lg">Status & Priority</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[#3a3226] text-sm font-medium mb-2">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as 'todo' | 'inProgress' | 'done')}
                        className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                        required
                      >
                        <option value="todo">To Do</option>
                        <option value="inProgress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#3a3226] text-sm font-medium mb-2">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                        className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                        required
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                <div className="p-4 md:p-5 bg-[#f9f6f1] rounded-lg mb-6">
                  <h3 className="text-[#3a3226] font-medium mb-4 text-lg">Assignment</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[#3a3226] text-sm font-medium mb-2">
                        Assignee
                      </label>

                      {/* Loading State */}
                      {loadingTeamMembers ? (
                        <div className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg border border-[#f5f0e8] flex items-center justify-center">
                          <Loader2Icon className="h-5 w-5 text-[#d4a5a5] animate-spin mr-2" />
                          <span>Loading team members...</span>
                        </div>
                      ) : teamMemberError ? (
                        // Error State
                        <div className="bg-[#f9e9e9] text-[#d4a5a5] w-full px-4 py-3 rounded-lg border border-[#d4a5a5] flex items-start">
                          <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">Error Loading Team Members</p>
                            <p className="text-sm">{teamMemberError}</p>
                          </div>
                        </div>
                      ) : (
                        // Loaded State
                        <div className="space-y-3">
                          {teamMembers.length === 0 ? (
                            <div className="bg-[#f5f0e8] text-[#7a7067] w-full px-4 py-3 rounded-lg border border-[#f5f0e8] flex items-center">
                              <UserIcon className="h-5 w-5 mr-2" />
                              <span>No team members available. Task will be unassigned.</span>
                            </div>
                          ) : (
                            <select
                              value={assignee}
                              onChange={e => setAssignee(e.target.value)}
                              className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                              required={teamMembers.length > 0}
                            >
                              <option value="">Select assignee</option>
                              {teamMembers.map(member => (
                                <option key={member.id} value={member.name}>
                                  {member.name} {member.role === 'admin' ? '(Admin)' : ''}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Selected Assignee Preview */}
                          {selectedMember && (
                            <div className="flex items-center p-3 bg-[#f5f0e8]/50 rounded-lg mt-2">
                              <Avatar
                                src={selectedMember.avatar}
                                alt={selectedMember.name}
                                size="md"
                                className="mr-3"
                              />
                              <div>
                                <p className="text-[#3a3226] font-medium">{selectedMember.name}</p>
                                <p className="text-xs text-[#7a7067] capitalize flex items-center">
                                  {selectedMember.role === 'admin' ? (
                                    <>
                                      <span className="inline-block w-2 h-2 rounded-full bg-[#d4a5a5] mr-1"></span>
                                      Administrator
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-block w-2 h-2 rounded-full bg-[#7a7067] mr-1"></span>
                                      Team Member
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#3a3226] text-sm font-medium mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="bg-white text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout - Single Column Structure (hidden on desktop) */}
            <div className="md:hidden space-y-5">
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[120px]"
                  placeholder="Enter task description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#3a3226] text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as 'todo' | 'inProgress' | 'done')}
                    className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                    required
                  >
                    <option value="todo">To Do</option>
                    <option value="inProgress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                />
              </div>

              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Assignee
                </label>

                {/* Loading State */}
                {loadingTeamMembers ? (
                  <div className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg flex items-center justify-center">
                    <Loader2Icon className="h-5 w-5 text-[#d4a5a5] animate-spin mr-2" />
                    <span>Loading team members...</span>
                  </div>
                ) : teamMemberError ? (
                  // Error State
                  <div className="bg-[#f9e9e9] text-[#d4a5a5] w-full px-4 py-3 rounded-lg border border-[#d4a5a5] flex items-start">
                    <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Error Loading Team Members</p>
                      <p className="text-sm">{teamMemberError}</p>
                    </div>
                  </div>
                ) : (
                  // Loaded State
                  <div className="space-y-3">
                    {teamMembers.length === 0 ? (
                      <div className="bg-[#f5f0e8] text-[#7a7067] w-full px-4 py-3 rounded-lg flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" />
                        <span>No team members available. Task will be unassigned.</span>
                      </div>
                    ) : (
                      <select
                        value={assignee}
                        onChange={e => setAssignee(e.target.value)}
                        className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
                        required={teamMembers.length > 0}
                      >
                        <option value="">Select assignee</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.name}>
                            {member.name} {member.role === 'admin' ? '(Admin)' : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Selected Assignee Preview */}
                    {selectedMember && (
                      <div className="flex items-center p-3 bg-white rounded-lg mt-2">
                        <Avatar
                          src={selectedMember.avatar}
                          alt={selectedMember.name}
                          size="md"
                          className="mr-3"
                        />
                        <div>
                          <p className="text-[#3a3226] font-medium">{selectedMember.name}</p>
                          <p className="text-xs text-[#7a7067] capitalize flex items-center">
                            {selectedMember.role === 'admin' ? (
                              <>
                                <span className="inline-block w-2 h-2 rounded-full bg-[#d4a5a5] mr-1"></span>
                                Administrator
                              </>
                            ) : (
                              <>
                                <span className="inline-block w-2 h-2 rounded-full bg-[#7a7067] mr-1"></span>
                                Team Member
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Footer with sticky positioning */}
            <div className="sticky bottom-0 bg-white pt-5 pb-2 border-t border-[#f5f0e8] flex flex-col sm:flex-row gap-3 sm:justify-end mt-6 z-20 shadow-md">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-2 sm:order-1 hover:bg-[#ebe6de] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto order-1 sm:order-2 hover:bg-[#c99595] transition-colors"
              >
                {initialTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TaskForm;