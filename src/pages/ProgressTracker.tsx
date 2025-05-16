import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BarChart3Icon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  Loader2Icon,
  AlertCircleIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../firebase/database';
import Avatar from '../components/Avatar';

// Define interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
}

interface Task {
  id: string;
  status: 'todo' | 'inProgress' | 'done';
  assignee: {
    name: string;
  };
  progress?: number;
}

interface Lead {
  id: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

interface TeamMemberStats {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  completedTasks: number;
  leadsAdded: number;
  untouchedTasks: number;
  inProgressTasks: number;
  progressCondition: 'Super Active' | 'Warming Up' | 'Barely Breathing';
}

const ProgressTracker: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMembers, setExpandedMembers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    tasks: true,
    leads: true
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch users from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<User[]>('users', (data) => {
      if (data) {
        setUsers(data);
      } else {
        setUsers([]);
      }
      setLoading(prev => ({ ...prev, users: false }));
    }, (error) => {
      console.error('Error fetching users:', error);
      setError('Failed to load team members. Please try again.');
      setLoading(prev => ({ ...prev, users: false }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch tasks from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Task[]>('tasks', (data) => {
      if (data) {
        setTasks(data);
      } else {
        setTasks([]);
      }
      setLoading(prev => ({ ...prev, tasks: false }));
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
      setLoading(prev => ({ ...prev, tasks: false }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch leads from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Lead[]>('leads', (data) => {
      if (data) {
        setLeads(data);
      } else {
        setLeads([]);
      }
      setLoading(prev => ({ ...prev, leads: false }));
    }, (error) => {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads. Please try again.');
      setLoading(prev => ({ ...prev, leads: false }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Calculate team member statistics
  const teamMemberStats = useMemo(() => {
    if (loading.users || loading.tasks || loading.leads) return [];

    return users.map(user => {
      // Count completed tasks for this user
      const completedTasks = tasks.filter(
        task => task.assignee?.name === user.name && task.status === 'done'
      ).length;

      // Count leads added by this user
      const leadsAdded = leads.filter(
        lead => lead.createdBy?.id === user.id
      ).length;

      // Count untouched tasks (todo with 0% progress)
      const untouchedTasks = tasks.filter(
        task => task.assignee?.name === user.name &&
               task.status === 'todo' &&
               (task.progress === 0 || task.progress === undefined)
      ).length;

      // Count in-progress tasks
      const inProgressTasks = tasks.filter(
        task => task.assignee?.name === user.name &&
               (task.status === 'inProgress' ||
                (task.status === 'todo' && task.progress && task.progress > 0))
      ).length;

      // Determine progress condition based on activity
      let progressCondition: 'Super Active' | 'Warming Up' | 'Barely Breathing';

      const totalActivity = completedTasks + leadsAdded;
      if (totalActivity >= 20) {
        progressCondition = 'Super Active';
      } else if (totalActivity >= 10) {
        progressCondition = 'Warming Up';
      } else {
        progressCondition = 'Barely Breathing';
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'Admin' : 'Team Member',
        avatar: user.avatar,
        completedTasks,
        leadsAdded,
        untouchedTasks,
        inProgressTasks,
        progressCondition
      };
    });
  }, [users, tasks, leads, loading]);

  // Filter team members based on search query
  const filteredTeamMembers = useMemo(() => {
    return teamMemberStats.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamMemberStats, searchQuery]);

  // Toggle expanded state for a team member
  const toggleMemberExpanded = (memberId: string) => {
    setExpandedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Get color for progress condition
  const getProgressColor = (condition: string) => {
    switch (condition) {
      case 'Super Active':
        return 'text-[#7eb8ab]';
      case 'Warming Up':
        return 'text-[#b8b87e]';
      case 'Barely Breathing':
        return 'text-[#d4a5a5]';
      default:
        return 'text-[#7a7067]';
    }
  };

  // Get background color for progress condition dot
  const getProgressDotColor = (condition: string) => {
    switch (condition) {
      case 'Super Active':
        return 'bg-[#7eb8ab]';
      case 'Warming Up':
        return 'bg-[#b8b87e]';
      case 'Barely Breathing':
        return 'bg-[#d4a5a5]';
      default:
        return 'bg-[#7a7067]';
    }
  };

  // Get icon for progress condition
  const getProgressIcon = (condition: string) => {
    switch (condition) {
      case 'Super Active':
        return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case 'Warming Up':
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'Barely Breathing':
        return <XCircleIcon className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-1">
          Team Progress Tracker
        </h1>
        <p className="text-[#7a7067] text-sm">
          Quick look at everyone's task count, status, and completion rate.
        </p>
      </header>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 md:p-5 mb-6 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f5f0e8] rounded-lg text-[#3a3226] placeholder-[#7a7067] focus:outline-none focus:ring-1 focus:ring-[#d4a5a5] text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7a7067]" />
        </div>
      </div>

      {/* Team Members Progress List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading.users || loading.tasks || loading.leads ? (
          <div className="p-8 flex justify-center">
            <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircleIcon className="h-8 w-8 text-[#d4a5a5] mx-auto mb-4" />
            <p className="text-[#3a3226]">{error}</p>
          </div>
        ) : filteredTeamMembers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#7a7067]">No team members found</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              {/* Table Header */}
              <div className="grid grid-cols-12 py-3 px-6 border-b border-[#f5f0e8] bg-[#f9f6f1]">
                <div className="col-span-3 text-[#3a3226] font-medium text-sm">Teammate</div>
                <div className="col-span-2 text-[#3a3226] font-medium text-sm">Role</div>
                <div className="col-span-3 text-[#3a3226] font-medium text-sm">Email</div>
                <div className="col-span-1 text-[#3a3226] font-medium text-sm text-center">Tasks Completed</div>
                <div className="col-span-1 text-[#3a3226] font-medium text-sm text-center">Progress</div>
                <div className="col-span-2 text-[#3a3226] font-medium text-sm text-center">Leads count</div>
              </div>

              {/* Team Members */}
              {filteredTeamMembers.map((member) => (
                <div key={member.id} className={`border-b border-[#f5f0e8] last:border-b-0 ${expandedMembers.includes(member.id) ? 'bg-[#f8f4ee]' : 'bg-white'}`}>
                  {/* Main Row */}
                  <div
                    className="grid grid-cols-12 py-4 px-6 items-center cursor-pointer transition-colors"
                    onClick={() => toggleMemberExpanded(member.id)}
                  >
                    <div className="col-span-3 flex items-center">
                      <Avatar
                        src={member.avatar}
                        alt={member.name}
                        size="sm"
                        className="mr-3 w-8 h-8"
                      />
                      <span className="text-[#3a3226] font-medium text-sm">
                        {member.name}
                      </span>
                    </div>
                    <div className="col-span-2 text-[#7a7067] text-sm">
                      {member.role}
                    </div>
                    <div className="col-span-3 text-[#7a7067] text-sm truncate">
                      {member.email}
                    </div>
                    <div className="col-span-1 text-center font-mono text-2xl text-[#3a3226]">
                      {member.completedTasks.toString().padStart(2, '0')}
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getProgressDotColor(member.progressCondition)}`}></span>
                        <span className={`text-sm ${getProgressColor(member.progressCondition)}`}>
                          {member.progressCondition}
                        </span>
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-mono text-2xl text-[#3a3226]">
                      {member.leadsAdded.toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedMembers.includes(member.id) && (
                    <div className="grid grid-cols-12 gap-6 px-6 py-5">
                      <div className="col-span-4 bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-[#7a7067] text-sm mb-1">Untouched task</div>
                        <div className="font-mono text-2xl text-[#3a3226]">
                          {member.untouchedTasks.toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="col-span-4 bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-[#7a7067] text-sm mb-1">In Progress task</div>
                        <div className="font-mono text-2xl text-[#3a3226]">
                          {member.inProgressTasks.toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="col-span-4 bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-[#7a7067] text-sm mb-1">Completed task</div>
                        <div className="font-mono text-2xl text-[#3a3226]">
                          {member.completedTasks.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {filteredTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`border-b border-[#f5f0e8] last:border-b-0 p-4 ${expandedMembers.includes(member.id) ? 'bg-[#f8f4ee]' : 'bg-white'}`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleMemberExpanded(member.id)}
                  >
                    <div className="flex items-center mb-3">
                      <Avatar
                        src={member.avatar}
                        alt={member.name}
                        size="sm"
                        className="mr-3 w-8 h-8"
                      />
                      <div>
                        <div className="text-[#3a3226] font-medium text-sm">
                          {member.name}
                        </div>
                        <div className="text-[#7a7067] text-xs">
                          {member.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-[#7a7067] text-xs mb-3 truncate">
                      {member.email}
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <div className="flex flex-col items-center">
                        <div className="text-[#7a7067] text-xs mb-1">Tasks</div>
                        <div className="font-mono text-2xl text-[#3a3226]">
                          {member.completedTasks.toString().padStart(2, '0')}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getProgressDotColor(member.progressCondition)}`}></span>
                        <span className={`text-sm ${getProgressColor(member.progressCondition)}`}>
                          {member.progressCondition}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="text-[#7a7067] text-xs mb-1">Leads</div>
                        <div className="font-mono text-2xl text-[#3a3226]">
                          {member.leadsAdded.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      {expandedMembers.includes(member.id) ? (
                        <ChevronUpIcon className="h-4 w-4 text-[#7a7067]" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-[#7a7067]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details for Mobile */}
                  {expandedMembers.includes(member.id) && (
                    <div className="mt-3 pt-3 border-t border-[#f8f4ee]/60">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-[#7a7067] text-xs mb-1">Untouched</div>
                          <div className="font-mono text-xl text-[#3a3226]">
                            {member.untouchedTasks.toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-[#7a7067] text-xs mb-1">In Progress</div>
                          <div className="font-mono text-xl text-[#3a3226]">
                            {member.inProgressTasks.toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-[#7a7067] text-xs mb-1">Completed</div>
                          <div className="font-mono text-xl text-[#3a3226]">
                            {member.completedTasks.toString().padStart(2, '0')}
                          </div>
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
    </div>
  );
};

export default ProgressTracker;
