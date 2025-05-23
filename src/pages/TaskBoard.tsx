import { useMemo, useState, useEffect } from 'react';
import {
  PlusIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, XIcon,
  Trash2Icon, AlertTriangleIcon, CalendarIcon, ClockIcon,
  CheckCircleIcon, ListTodoIcon, BarChart3Icon, MessageSquareIcon, InfoIcon,
  EditIcon, SlidersHorizontal, UserIcon, SendIcon, LockIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaskForm from '../components/TaskForm';
import { useNotifications } from '../contexts/NotificationContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy: {
    name: string;
    avatar: string;
  };
}

interface TaskHistoryItem {
  id: string;
  action: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
  details?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string; // Store as ISO string for Firebase compatibility
  assignee: {
    name: string;
    avatar: string;
  };
  progress?: number;
  comments?: TaskComment[];
  history?: TaskHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
  progressLocked?: boolean; // Flag to indicate if progress has been updated by a non-admin user
  progressLockedBy?: {
    name: string;
    timestamp: string;
  }; // Information about who locked the progress
}
const TaskBoard = () => {
  const {
    isAdmin,
    user
  } = useAuth();
  const {
    addNotification
  } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<(Task & {
    progress?: number;
  }) | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<string[]>(['Emma Chen']);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{id: string, title: string} | null>(null);

  // State for task detail modal tabs
  const [activeTaskTab, setActiveTaskTab] = useState<'details' | 'activity'>('details');
  const [newComment, setNewComment] = useState('');

  // State for progress confirmation dialog
  const [isProgressConfirmOpen, setIsProgressConfirmOpen] = useState(false);
  const [pendingProgressUpdate, setPendingProgressUpdate] = useState<{
    taskId: string;
    newState: 'not-started' | 'in-progress' | 'completed';
    isFirstUpdate?: boolean;
  } | null>(null);

  // Fetch tasks from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Task[]>('tasks', (data) => {
      if (data) {
        // Ensure all tasks have valid assignee data
        const validatedTasks = data.map(task => ({
          ...task,
          assignee: ensureValidAssignee(task.assignee)
        }));

        setTasks(validatedTasks);

        // Check for task ID in URL query parameter
        const params = new URLSearchParams(location.search);
        const taskId = params.get('task');

        if (taskId) {
          const task = validatedTasks.find(t => t.id === taskId);
          if (task) {
            setSelectedTask(task);

            // Expand the member section for this task
            if (task.assignee && task.assignee.name) {
              setExpandedMembers(prev =>
                prev.includes(task.assignee.name) ? prev : [...prev, task.assignee.name]
              );
            }

            // Clear the URL parameter after handling it
            navigate('/taskboard', { replace: true });
          }
        }
      } else {
        setTasks([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [location.search, navigate]);
  const canUpdateProgress = (task: Task) => {
    return isAdmin() || task.assignee.name === user?.name;
  };

  // Helper function to format dates in a user-friendly way
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Check if date is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    // Check if date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                         date.getMonth() === yesterday.getMonth() &&
                         date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' at ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  const tasksByMember = useMemo(() => {
    const filtered = tasks.filter(task => {
      const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
      const statusMatch = filterStatus === 'all' || task.status === filterStatus;
      return priorityMatch && statusMatch;
    });
    return filtered.reduce((acc, task) => {
      const memberName = task.assignee.name;
      if (!acc[memberName]) {
        acc[memberName] = {
          avatar: task.assignee.avatar,
          tasks: []
        };
      }
      acc[memberName].tasks.push(task);
      return acc;
    }, {} as Record<string, {
      avatar: string;
      tasks: Task[];
    }>);
  }, [tasks, filterPriority, filterStatus]);
  // Helper function to ensure assignee avatar is valid
  const ensureValidAssignee = (assignee: { name: string; avatar: string }) => {
    return {
      name: assignee.name || 'Unassigned',
      avatar: assignee.avatar || '' // Empty string will trigger the Avatar component's fallback
    };
  };

  // Modified to accept the form data with Date object for dueDate
  const handleAddTask = async (newTaskFormData: {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'todo' | 'inProgress' | 'done';
    dueDate?: Date;
    assignee: {
      name: string;
      avatar: string;
    };
  }) => {
    try {
      // Ensure assignee has valid data
      const validatedAssignee = ensureValidAssignee(newTaskFormData.assignee);

      const now = new Date().toISOString();

      // Create history item for task creation
      const historyItem: TaskHistoryItem = {
        id: Date.now().toString(),
        action: 'task_created',
        timestamp: now,
        user: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || ''
        },
        details: 'Task was created'
      };

      // Convert Date object to ISO string if it exists
      const taskWithStringDate = {
        ...newTaskFormData,
        assignee: validatedAssignee,
        dueDate: newTaskFormData.dueDate ? newTaskFormData.dueDate.toISOString() : undefined,
        progress: 0, // Not Started
        createdAt: now,
        updatedAt: now,
        history: [historyItem]
      };

      // Add task to Firebase
      await addData('tasks', taskWithStringDate);

      setIsAddTaskModalOpen(false);

      // Add notification
      await addNotification({
        title: 'New Task Created',
        message: `Task "${taskWithStringDate.title}" has been assigned to ${taskWithStringDate.assignee.name}`,
        type: 'task'
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  const toggleMemberExpanded = (memberName: string) => {
    setExpandedMembers(prev => prev.includes(memberName) ? prev.filter(name => name !== memberName) : [...prev, memberName]);
  };
  // Removed unused getStatusColor function
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-[#d4a5a5]';
      case 'Medium':
        return 'text-[#b8b87e]';
      case 'Low':
        return 'text-[#7eb8ab]';
      default:
        return 'text-[#7a7067]';
    }
  };
  // Helper function to convert progress state to percentage
  const progressStateToPercentage = (state: string): number => {
    switch (state) {
      case 'not-started':
        return 0;
      case 'in-progress':
        return 50;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  // Helper function to convert percentage to progress state
  const percentageToProgressState = (percentage: number): string => {
    if (percentage === 0) return 'not-started';
    if (percentage === 100) return 'completed';
    return 'in-progress';
  };

  // Helper function to get human-readable progress state label
  const getProgressStateLabel = (state: string): string => {
    switch (state) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Not Started';
    }
  };

  // Helper function to determine if a progress change is forward
  const isForwardProgressChange = (currentState: string, newState: string): boolean => {
    // Define the progress order: not-started < in-progress < completed
    const progressOrder = {
      'not-started': 0,
      'in-progress': 1,
      'completed': 2
    };

    // Return true if the new state has a higher value than the current state
    return progressOrder[newState as keyof typeof progressOrder] > progressOrder[currentState as keyof typeof progressOrder];
  };

  // Function to handle progress state update
  const handleProgressStateUpdate = async (taskId: string, newState: 'not-started' | 'in-progress' | 'completed') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if user is admin
    if (isAdmin()) {
      // Admins can always update progress in any direction
      const newProgress = progressStateToPercentage(newState);
      await handleProgressUpdate(taskId, newProgress);
      return;
    }

    // For non-admin users, check if the task already has progress set
    const currentProgress = task.progress || 0;
    const currentState = percentageToProgressState(currentProgress);

    // If the task has no progress yet (first update), allow the update with confirmation
    if (currentProgress === 0) {
      // For the first update from "Not Started" to something else, show confirmation dialog
      if (newState !== 'not-started') {
        // Store the pending update and show confirmation dialog
        setPendingProgressUpdate({ taskId, newState, isFirstUpdate: true });
        setIsProgressConfirmOpen(true);
      } else {
        // If trying to set to "Not Started" when already at 0%, no change needed
        return;
      }
    } else {
      // For subsequent updates, check if it's a forward progress change
      if (isForwardProgressChange(currentState, newState)) {
        // Allow forward progress changes with confirmation
        setPendingProgressUpdate({ taskId, newState, isFirstUpdate: false });
        setIsProgressConfirmOpen(true);
      } else {
        // Silently ignore backward progress changes for non-admin users
        // No notification, just don't process the request
        return;
      }
    }
  };

  const handleProgressUpdate = async (taskId: string, newProgress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Normalize progress to one of the three states (0%, 50%, 100%)
    let boundedProgress: number;
    if (newProgress === 0) {
      boundedProgress = 0; // Not Started
    } else if (newProgress === 100) {
      boundedProgress = 100; // Completed
    } else {
      boundedProgress = 50; // In Progress
    }

    // Skip if progress hasn't changed
    if (task.progress === boundedProgress) return;

    if (!canUpdateProgress(task)) {
      await addNotification({
        title: 'Access Denied',
        message: 'You can only update progress on tasks assigned to you',
        type: 'system'
      });
      return;
    }

    try {
      // Determine new status based on progress
      const newStatus = boundedProgress === 100 ? 'done' : boundedProgress > 0 ? 'inProgress' : 'todo';
      const oldStatus = task.status;
      const statusChanged = oldStatus !== newStatus;

      // Get progress state labels for history
      const oldProgressState = percentageToProgressState(task.progress || 0);
      const newProgressState = percentageToProgressState(boundedProgress);

      // Create history item for this action
      const historyItem: TaskHistoryItem = {
        id: Date.now().toString(),
        action: 'progress_updated',
        timestamp: new Date().toISOString(),
        user: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || ''
        },
        details: `Updated progress from "${getProgressStateLabel(oldProgressState)}" to "${getProgressStateLabel(newProgressState)}"${
          statusChanged ? ` and status from ${oldStatus} to ${newStatus}` : ''
        }`
      };

      // Get existing history or initialize empty array
      const existingHistory = task.history || [];

      // Determine if we need to lock the progress
      // Lock if:
      // 1. User is not an admin
      // 2. Task is not already locked
      // This ensures that any progress change by a non-admin will lock the task
      const shouldLockProgress = !isAdmin() && !task.progressLocked;

      // Create update object
      const updateObject: any = {
        progress: boundedProgress,
        status: newStatus,
        history: [...existingHistory, historyItem],
        updatedAt: new Date().toISOString()
      };

      // Add progress locking information if needed
      if (shouldLockProgress) {
        updateObject.progressLocked = true;
        updateObject.progressLockedBy = {
          name: user?.name || 'Anonymous',
          timestamp: new Date().toISOString()
        };
      }

      // Update task in Firebase
      await updateData('tasks', taskId, updateObject);

      // Notify on progress state changes
      await addNotification({
        title: 'Progress Updated',
        message: `${task.title} is now ${getProgressStateLabel(newProgressState)}`,
        type: 'task'
      });

      // Update the selected task's progress if it's open
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => {
          if (!prev) return null;

          const updatedTask = {
            ...prev,
            progress: boundedProgress,
            status: newStatus as 'todo' | 'inProgress' | 'done',
            history: [...(prev.history || []), historyItem],
            updatedAt: new Date().toISOString()
          };

          // Add progress locking information if needed
          if (shouldLockProgress) {
            updatedTask.progressLocked = true;
            updatedTask.progressLockedBy = {
              name: user?.name || 'Anonymous',
              timestamp: new Date().toISOString()
            };
          }

          return updatedTask;
        });
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };
  // Modified to accept the form data with Date object for dueDate
  const handleEditTask = async (taskId: string, updatedTaskFormData: {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'todo' | 'inProgress' | 'done';
    dueDate?: Date;
    assignee: {
      name: string;
      avatar: string;
    };
  }) => {
    try {
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) return;

      // Ensure assignee has valid data
      const validatedAssignee = ensureValidAssignee(updatedTaskFormData.assignee);

      // Convert Date object to ISO string if it exists
      const taskWithStringDate = {
        ...updatedTaskFormData,
        assignee: validatedAssignee,
        dueDate: updatedTaskFormData.dueDate ? updatedTaskFormData.dueDate.toISOString() : undefined,
        updatedAt: new Date().toISOString()
      };

      // Create history item for this action
      const historyItem: TaskHistoryItem = {
        id: Date.now().toString(),
        action: 'task_edited',
        timestamp: new Date().toISOString(),
        user: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || ''
        },
        details: 'Task details were edited'
      };

      // Get existing history or initialize empty array
      const existingHistory = originalTask.history || [];

      // Update task in Firebase
      await updateData('tasks', taskId, {
        ...taskWithStringDate,
        history: [...existingHistory, historyItem]
      });

      setEditingTask(null);

      // Add notification
      await addNotification({
        title: 'Task Updated',
        message: `Task "${updatedTaskFormData.title}" has been updated`,
        type: 'task'
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Function to open delete confirmation modal
  const confirmDeleteTask = (taskId: string, taskTitle: string) => {
    if (!isAdmin()) {
      addNotification({
        title: 'Access Denied',
        message: 'Only administrators can delete tasks',
        type: 'system'
      });
      return;
    }

    setTaskToDelete({ id: taskId, title: taskTitle });
    setIsDeleteModalOpen(true);
  };

  // Function to handle confirmed progress update
  const handleConfirmProgressUpdate = async () => {
    if (!pendingProgressUpdate) return;

    const { taskId, newState, isFirstUpdate } = pendingProgressUpdate;
    const newProgress = progressStateToPercentage(newState);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      setPendingProgressUpdate(null);
      return;
    }

    // Call the existing progress update function with the new percentage
    await handleProgressUpdate(taskId, newProgress);

    // Show success notification with appropriate message based on update type
    if (!isAdmin()) {
      if (isFirstUpdate) {
        // First update notification
        await addNotification({
          title: 'Progress Updated',
          message: `Task progress has been updated to ${getProgressStateLabel(newState)}. You can only move this task's progress forward from now on.`,
          type: 'task'
        });
      } else {
        // Forward progress update notification
        await addNotification({
          title: 'Progress Updated',
          message: `Task progress has been updated to ${getProgressStateLabel(newState)}.`,
          type: 'task'
        });
      }
    } else {
      // Admin notification
      await addNotification({
        title: 'Progress Updated',
        message: `Task progress has been updated to ${getProgressStateLabel(newState)}`,
        type: 'task'
      });
    }

    // Clear the pending update
    setPendingProgressUpdate(null);
  };

  // Function to handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete || !isAdmin()) {
      return;
    }

    try {
      // Delete task from Firebase
      await removeData('tasks', taskToDelete.id);

      // Close the task detail modal if it's open
      setSelectedTask(null);

      // Close the delete confirmation modal
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);

      // Add notification
      await addNotification({
        title: 'Task Deleted',
        message: `Task "${taskToDelete.title}" has been deleted`,
        type: 'task'
      });
    } catch (error) {
      console.error('Error deleting task:', error);

      await addNotification({
        title: 'Error',
        message: 'Failed to delete task. Please try again.',
        type: 'system'
      });
    }
  };

  // Function to add a comment to a task
  const handleAddComment = async (taskId: string) => {
    if (!selectedTask || !newComment.trim()) {
      return;
    }

    try {
      const comment: TaskComment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
        createdBy: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || ''
        }
      };

      // Get existing comments or initialize empty array
      const existingComments = selectedTask.comments || [];

      // Create history item for this action
      const historyItem: TaskHistoryItem = {
        id: Date.now().toString(),
        action: 'comment_added',
        timestamp: new Date().toISOString(),
        user: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || ''
        },
        details: 'Added a comment'
      };

      // Get existing history or initialize empty array
      const existingHistory = selectedTask.history || [];

      // Update task in Firebase
      await updateData('tasks', taskId, {
        comments: [...existingComments, comment],
        history: [...existingHistory, historyItem],
        updatedAt: new Date().toISOString()
      });

      // Update the selected task in state
      setSelectedTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...(prev.comments || []), comment],
          history: [...(prev.history || []), historyItem],
          updatedAt: new Date().toISOString()
        };
      });

      // Clear the comment input
      setNewComment('');

    } catch (error) {
      console.error('Error adding comment:', error);

      await addNotification({
        title: 'Error',
        message: 'Failed to add comment. Please try again.',
        type: 'system'
      });
    }
  };
  return <div>
      <header className="mb-6 md:mb-8">
        <div className="mb-4">
          <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
            Task Board
          </h1>
          <p className="text-[#7a7067]">View and manage tasks by team member</p>
        </div>

        {/* Filter and Add Task Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Filter Dropdown for Mobile */}
          <div className="relative sm:hidden w-full">
            <button
              className="flex items-center justify-between w-full px-4 py-3 bg-white text-[#7a7067] rounded-lg border border-[#f5f0e8]"
              onClick={() => document.getElementById('mobile-filters')?.classList.toggle('hidden')}
            >
              <span className="flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                <span>Filter Tasks</span>
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            <div id="mobile-filters" className="hidden absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-[#f5f0e8] p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#3a3226]">Priority</label>
                <select
                  className="w-full bg-[#f5f0e8] text-[#7a7067] px-4 py-3 rounded-lg"
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#3a3226]">Status</label>
                <select
                  className="w-full bg-[#f5f0e8] text-[#7a7067] px-4 py-3 rounded-lg"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex gap-3 flex-1">
            <select
              className="bg-white text-[#7a7067] px-4 py-3 rounded-lg border border-[#f5f0e8] min-w-[160px]"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <select
              className="bg-white text-[#7a7067] px-4 py-3 rounded-lg border border-[#f5f0e8] min-w-[160px]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Add Task Button */}
          {isAdmin() && (
            <button
              className="flex items-center justify-center px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto"
              onClick={() => setIsAddTaskModalOpen(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-[#7a7067]">Loading tasks...</div>
        </div>
      ) : Object.keys(tasksByMember).length === 0 ? (
        <div className="bg-white rounded-xl p-6 md:p-8 text-center">
          <p className="text-[#7a7067] mb-4">No tasks found.</p>
          {isAdmin() && (
            <button
              className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto"
              onClick={() => setIsAddTaskModalOpen(true)}
            >
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(tasksByMember).map(([memberName, {
          avatar,
          tasks
        }]) => (
            <div key={memberName} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-[#f5f0e8]">
              <button
                className="w-full p-5 flex items-center justify-between hover:bg-[#f5f0e8]/30 transition-all duration-200"
                onClick={() => toggleMemberExpanded(memberName)}
                aria-expanded={expandedMembers.includes(memberName)}
                aria-controls={`tasks-${memberName.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center">
                  <Avatar
                    src={avatar}
                    alt={memberName}
                    size="lg"
                    className="mr-4 border-2 border-[#d4a5a5]/20"
                  />
                  <div>
                    <h3 className="text-[#3a3226] font-medium text-lg md:text-xl">{memberName}</h3>
                    <p className="text-sm text-[#7a7067]">
                      {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Task Count Indicators - Desktop */}
                  <div className="hidden md:flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-[#7a7067] mb-1">Untouched Task</span>
                      <div className="h-10 w-10 rounded-lg border border-[#f5f0e8] flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-mono text-[#3a3226] font-medium">
                          {tasks.filter(task => task.progress === 0).length.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-[#7a7067] mb-1">In Progress</span>
                      <div className="h-10 w-10 rounded-lg border border-[#f5f0e8] flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-mono text-[#3a3226] font-medium">
                          {tasks.filter(task => task.progress === 50).length.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-[#7a7067] mb-1">Finished</span>
                      <div className="h-10 w-10 rounded-lg border border-[#f5f0e8] flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-mono text-[#3a3226] font-medium">
                          {tasks.filter(task => task.progress === 100).length.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Count Indicators - Mobile */}
                  <div className="flex md:hidden items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-lg border border-[#f5f0e8] flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
                          <span className="font-mono text-[#3a3226] text-sm font-medium">
                            {tasks.filter(task => task.progress === 0).length.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#7a7067] mt-0.5">Todo</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-lg border border-[#f5f0e8] flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
                          <span className="font-mono text-[#3a3226] text-sm font-medium">
                            {tasks.filter(task => task.progress === 50).length.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#7a7067] mt-0.5">In Prog</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-lg border border-[#f5f0e8] flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
                          <span className="font-mono text-[#3a3226] text-sm font-medium">
                            {tasks.filter(task => task.progress === 100).length.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#7a7067] mt-0.5">Done</span>
                      </div>
                    </div>
                  </div>

                  {expandedMembers.includes(memberName) ?
                    <ChevronUpIcon className="h-6 w-6 text-[#d4a5a5]" /> :
                    <ChevronDownIcon className="h-6 w-6 text-[#d4a5a5]" />
                  }
                </div>
              </button>

              {expandedMembers.includes(memberName) && (
                <div
                  id={`tasks-${memberName.replace(/\s+/g, '-').toLowerCase()}`}
                  className="p-5 border-t border-[#f5f0e8] space-y-5 bg-[#f5f0e8]/10"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl p-5 hover:bg-[#f5f0e8]/20 transition-all duration-200 h-full flex flex-col relative group shadow-sm hover:shadow-md border border-[#f5f0e8]"
                      >
                        {/* Task content - clickable */}
                        <div
                          className="flex-grow cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-[#3a3226] font-medium text-base md:text-lg">
                              {task.title}
                            </h4>
                            <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center bg-[#f5eee8] text-[#d4a5a5] border border-[#d4a5a5]/20 whitespace-nowrap ml-2 shadow-sm">
                              {task.progress === 0 ? (
                                <><ListTodoIcon className="h-3.5 w-3.5 mr-1.5 text-[#d4a5a5]" />Not Started (0%)</>
                              ) : task.progress === 50 ? (
                                <><BarChart3Icon className="h-3.5 w-3.5 mr-1.5 text-[#d4a5a5]" />In Progress (50%)</>
                              ) : (
                                <><CheckCircleIcon className="h-3.5 w-3.5 mr-1.5 text-[#d4a5a5]" />Completed (100%)</>
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-[#7a7067] mb-5 line-clamp-3 flex-grow leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Task footer */}
                        <div className="flex flex-wrap justify-between items-center gap-3 mt-auto pt-3 border-t border-[#f5f0e8]">
                          <div className="flex items-center">
                            <Avatar
                              src={task.assignee.avatar}
                              alt={task.assignee.name}
                              size="xs"
                              className="mr-2 border border-[#d4a5a5]/20"
                            />
                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority} Priority
                            </span>
                          </div>
                          {task.dueDate && (
                            <span className="text-xs text-[#7a7067] bg-[#f5f0e8]/30 px-2 py-1 rounded-lg border border-[#f5f0e8]">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Admin actions - only visible on hover */}
                        {isAdmin() && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              className="p-2 bg-white rounded-full text-[#d4a5a5] hover:text-white hover:bg-[#d4a5a5] shadow-sm border border-[#d4a5a5]/20 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteTask(task.id, task.title);
                              }}
                              title="Delete task"
                              aria-label="Delete task"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {isAddTaskModalOpen && (
        <TaskForm
          onClose={() => setIsAddTaskModalOpen(false)}
          onSubmit={(taskData) => {
            // Pass the task data directly with the Date object
            handleAddTask(taskData);
          }}
        />
      )}
      {/* Optimized Task Detail Modal - Full screen on mobile, centered on desktop */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              setSelectedTask(null);
            }
          }}
        >
          <div
            className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[600px] md:max-w-[800px] md:rounded-xl shadow-xl animate-scaleIn flex flex-col focus:outline-none"
            role="dialog"
            aria-labelledby="task-detail-title"
            aria-modal="true"
            tabIndex={0}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with sticky positioning */}
            <div className="sticky top-0 bg-white p-3 md:p-5 border-b border-[#f5f0e8] flex justify-between items-center z-20 shadow-md">
              <div className="flex items-center">
                <h2
                  id="task-detail-title"
                  className="font-['Caveat',_cursive] text-xl md:text-2xl text-[#3a3226]"
                >
                  {selectedTask.title}
                </h2>
                {/* Due date - only show in header for quick reference */}
                {selectedTask.dueDate && (
                  <span className="ml-3 text-xs md:text-sm text-[#7a7067] px-2 py-1 bg-[#f5f0e8]/50 rounded-lg flex items-center border border-[#f5f0e8] whitespace-nowrap">
                    <CalendarIcon className="h-3 w-3 mr-1 text-[#d4a5a5]" />
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-[#7a7067] hover:text-[#3a3226] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-2"
                aria-label="Close task details"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Navigation - Simplified and touch-friendly */}
            <div className="flex border-b border-[#f5f0e8] z-10">
              <button
                className={`flex-1 py-4 px-4 text-center font-medium text-sm focus:outline-none transition-colors ${
                  activeTaskTab === 'details'
                    ? 'text-[#d4a5a5] border-b-2 border-[#d4a5a5]'
                    : 'text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8]/30'
                }`}
                onClick={() => setActiveTaskTab('details')}
                aria-selected={activeTaskTab === 'details'}
                role="tab"
              >
                <div className="flex items-center justify-center">
                  <InfoIcon className="h-5 w-5 mr-2" />
                  Details
                </div>
              </button>
              <button
                className={`flex-1 py-4 px-4 text-center font-medium text-sm focus:outline-none transition-colors ${
                  activeTaskTab === 'activity'
                    ? 'text-[#d4a5a5] border-b-2 border-[#d4a5a5]'
                    : 'text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8]/30'
                }`}
                onClick={() => setActiveTaskTab('activity')}
                aria-selected={activeTaskTab === 'activity'}
                role="tab"
              >
                <div className="flex items-center justify-center">
                  <MessageSquareIcon className="h-5 w-5 mr-2" />
                  Activity
                </div>
              </button>
            </div>

            {/* Modal Content with padding and scrollable area - Improved for mobile */}
            <div className="flex-grow overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(100vh - 180px)', height: 'auto' }}>
              {/* Details Tab */}
              {activeTaskTab === 'details' && (
                <div className="p-3 md:p-5 space-y-5 animate-fadeIn">
                  {/* Task Info Section - Combines key metadata */}
                  <div className="bg-[#f5f0e8]/30 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex flex-wrap gap-3 mb-3">
                      {/* Priority Badge */}
                      <span className={`text-sm font-medium ${getPriorityColor(selectedTask.priority)} px-3 py-2 bg-white rounded-lg flex items-center border border-[#f5f0e8] min-h-[44px]`}>
                        <AlertTriangleIcon className="h-4 w-4 mr-2" />
                        {selectedTask.priority} Priority
                      </span>

                      {/* Created Date - Only show in details view */}
                      {selectedTask.createdAt && (
                        <span className="text-sm text-[#7a7067] px-3 py-2 bg-white rounded-lg flex items-center border border-[#f5f0e8] min-h-[44px]">
                          <ClockIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                          Created: {formatDate(selectedTask.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <h4 className="text-[#3a3226] font-medium text-sm uppercase tracking-wider mb-2 flex items-center">
                      <InfoIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                      Description
                    </h4>
                    <p className="text-[#3a3226] text-base whitespace-pre-line leading-relaxed p-3 bg-white rounded-lg border border-[#f5f0e8]">
                      {selectedTask.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Assignee Information - Simplified */}
                  <div className="bg-[#f5f0e8]/30 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-[#3a3226] font-medium text-sm uppercase tracking-wider mb-3 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                      Assignment
                    </h4>
                    <div className="flex items-center p-3 bg-white rounded-lg border border-[#f5f0e8] min-h-[44px]">
                      <Avatar
                        src={selectedTask.assignee.avatar}
                        alt={selectedTask.assignee.name}
                        size="md"
                        className="mr-3 border-2 border-[#d4a5a5]"
                      />
                      <div>
                        <p className="text-[#3a3226] font-medium">{selectedTask.assignee.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section - Optimized */}
                  <div className="bg-[#f5f0e8]/30 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[#3a3226] font-medium text-sm uppercase tracking-wider flex items-center">
                        <SlidersHorizontal className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                        Progress
                      </h4>

                      {/* Progress Lock Indicator */}
                      {selectedTask.progressLocked && (
                        <div className="flex items-center text-xs text-[#d4a5a5] bg-[#f5eee8] px-2 py-1 rounded-lg border border-[#d4a5a5]/20 min-h-[32px]">
                          <LockIcon className="h-3 w-3 mr-1" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Lock Info - Show if locked */}
                    {selectedTask.progressLocked && selectedTask.progressLockedBy && (
                      <div className="mb-3 p-3 bg-[#f5eee8]/70 rounded-lg border border-[#d4a5a5]/20 text-sm text-[#7a7067]">
                        <p>Progress locked by <span className="font-medium text-[#3a3226]">{selectedTask.progressLockedBy.name}</span></p>
                        {!isAdmin() && (
                          <p className="mt-1">Only admins can change progress now</p>
                        )}
                      </div>
                    )}

                    {/* Progress Bar - Visual representation */}
                    <div className="h-4 bg-white rounded-full overflow-hidden border border-[#f5f0e8] shadow-sm mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-in-out bg-[#d4a5a5] ${
                          selectedTask.progress === 0
                            ? 'opacity-30 w-0'
                            : selectedTask.progress === 50
                              ? 'opacity-70 w-1/2'
                              : 'opacity-100 w-full'
                        }`}
                      ></div>
                    </div>

                    {/* Progress Update Controls - Only show if user is admin or task assignee */}
                    {canUpdateProgress(selectedTask) && (
                      <div className="mt-4 pt-3 border-t border-[#f5f0e8]/70">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm text-[#3a3226] font-medium">Update progress:</p>

                          {/* Forward-only indicator for non-admin users */}
                          {!isAdmin() && selectedTask.progress && selectedTask.progress > 0 && (
                            <div className="flex items-center text-xs text-[#d4a5a5]">
                              <LockIcon className="h-3 w-3 mr-1" />
                              <span>Forward only</span>
                            </div>
                          )}
                        </div>

                        {/* Three-State Progress Options - Touch-friendly */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Not Started Option - Only show for admins or if task is already at 0% */}
                          {(isAdmin() || (selectedTask.progress || 0) === 0) && (
                            <button
                              onClick={() => handleProgressStateUpdate(selectedTask.id, 'not-started')}
                              className={`flex items-center p-3 rounded-xl transition-all duration-200 min-h-[44px] ${
                                (selectedTask.progress || 0) === 0
                                  ? 'bg-[#f5eee8] border-2 border-[#d4a5a5] shadow-md'
                                  : 'bg-white border border-[#f5f0e8] hover:bg-[#f5eee8]/50 hover:shadow-md'
                              } focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1`}
                              aria-pressed={(selectedTask.progress || 0) === 0}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                                (selectedTask.progress || 0) === 0
                                  ? 'bg-[#d4a5a5] text-white'
                                  : 'bg-[#f5eee8] text-[#d4a5a5]'
                              }`}>
                                <ListTodoIcon className="h-4 w-4" />
                              </div>
                              <span className={`text-sm font-medium ${
                                (selectedTask.progress || 0) === 0
                                  ? 'text-[#3a3226]'
                                  : 'text-[#7a7067]'
                              }`}>
                                Not Started (0%)
                              </span>
                            </button>
                          )}

                          {/* In Progress Option - Show for admins, or if task is at 0%, or if task is already at 50% */}
                          {(isAdmin() || (selectedTask.progress || 0) === 0 || (selectedTask.progress || 0) === 50) && (
                            <button
                              onClick={() => handleProgressStateUpdate(selectedTask.id, 'in-progress')}
                              className={`flex items-center p-3 rounded-xl transition-all duration-200 min-h-[44px] ${
                                (selectedTask.progress || 0) === 50
                                  ? 'bg-[#f5eee8] border-2 border-[#d4a5a5] shadow-md'
                                  : 'bg-white border border-[#f5f0e8] hover:bg-[#f5eee8]/50 hover:shadow-md'
                              } focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1`}
                              aria-pressed={(selectedTask.progress || 0) === 50}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                                (selectedTask.progress || 0) === 50
                                  ? 'bg-[#d4a5a5] text-white'
                                  : 'bg-[#f5eee8] text-[#d4a5a5]'
                              }`}>
                                <BarChart3Icon className="h-4 w-4" />
                              </div>
                              <span className={`text-sm font-medium ${
                                (selectedTask.progress || 0) === 50
                                  ? 'text-[#3a3226]'
                                  : 'text-[#7a7067]'
                              }`}>
                                In Progress (50%)
                              </span>
                            </button>
                          )}

                          {/* Completed Option - Always show (all users can move to completed) */}
                          <button
                            onClick={() => handleProgressStateUpdate(selectedTask.id, 'completed')}
                            className={`flex items-center p-3 rounded-xl transition-all duration-200 min-h-[44px] ${
                              (selectedTask.progress || 0) === 100
                                ? 'bg-[#f5eee8] border-2 border-[#d4a5a5] shadow-md'
                                : 'bg-white border border-[#f5f0e8] hover:bg-[#f5eee8]/50 hover:shadow-md'
                            } focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1`}
                            aria-pressed={(selectedTask.progress || 0) === 100}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                              (selectedTask.progress || 0) === 100
                                ? 'bg-[#d4a5a5] text-white'
                                : 'bg-[#f5eee8] text-[#d4a5a5]'
                            }`}>
                              <CheckCircleIcon className="h-4 w-4" />
                            </div>
                            <span className={`text-sm font-medium ${
                              (selectedTask.progress || 0) === 100
                                ? 'text-[#3a3226]'
                                : 'text-[#7a7067]'
                            }`}>
                              Completed (100%)
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Tab - Optimized for mobile */}
              {activeTaskTab === 'activity' && (
                <div className="p-3 md:p-5 space-y-5 animate-fadeIn">
                  {/* Comments Section */}
                  <div className="bg-[#f5f0e8]/30 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-[#3a3226] font-medium text-sm uppercase tracking-wider mb-3 flex items-center">
                      <MessageSquareIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                      Comments
                    </h4>

                    {/* Comment List */}
                    <div className="space-y-3 mb-4">
                      {selectedTask.comments && selectedTask.comments.length > 0 ? (
                        selectedTask.comments.map(comment => (
                          <div key={comment.id} className="flex gap-2 p-3 bg-white rounded-lg border border-[#f5f0e8] shadow-sm">
                            <Avatar
                              src={comment.createdBy.avatar}
                              alt={comment.createdBy.name}
                              size="sm"
                              className="flex-shrink-0 border border-[#d4a5a5]"
                              fallbackBgColor="primary"
                              debug={false}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap justify-between items-start gap-1">
                                <p className="text-[#3a3226] font-medium text-sm">
                                  {comment.createdBy.name}
                                </p>
                                <span className="text-xs text-[#7a7067] bg-[#f5f0e8]/50 px-2 py-1 rounded-full whitespace-nowrap">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-[#3a3226] text-sm mt-2 leading-relaxed break-words">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-[#7a7067] bg-white rounded-lg border border-[#f5f0e8]">
                          <MessageSquareIcon className="h-8 w-8 mx-auto mb-2 text-[#f5f0e8]" />
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      )}
                    </div>

                    {/* Add Comment Form - Touch-friendly */}
                    <div className="mt-4 pt-3 border-t border-[#f5f0e8]/70">
                      <div className="flex gap-2">
                        <Avatar
                          src={user?.avatar || ''}
                          alt={user?.name || 'You'}
                          size="sm"
                          className="flex-shrink-0 border border-[#d4a5a5] mt-1"
                          fallbackBgColor="primary"
                        />
                        <div className="flex-1 relative">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full px-3 py-2 bg-white text-[#3a3226] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] border border-[#f5f0e8] focus:border-[#d4a5a5] min-h-[80px] resize-none shadow-sm"
                          />
                          <button
                            onClick={() => handleAddComment(selectedTask.id)}
                            disabled={!newComment.trim()}
                            className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-[#d4a5a5] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c99595] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1 shadow-sm"
                            aria-label="Send comment"
                          >
                            <SendIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task History Section - Simplified */}
                  <div className="bg-[#f5f0e8]/30 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-[#3a3226] font-medium text-sm uppercase tracking-wider mb-3 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2 text-[#d4a5a5]" />
                      Task History
                    </h4>

                    {/* History Timeline - Mobile-optimized */}
                    <div className="space-y-3 relative pl-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#f5f0e8]">
                      {selectedTask.history && selectedTask.history.length > 0 ? (
                        selectedTask.history.map(item => (
                          <div key={item.id} className="relative">
                            <div className="absolute left-[-16px] top-1">
                              <Avatar
                                src={item.user.avatar}
                                alt={item.user.name}
                                size="xs"
                                fallbackBgColor="primary"
                                className="border border-[#d4a5a5]"
                              />
                            </div>
                            <div className="flex flex-wrap justify-between items-start bg-white p-2 rounded-lg border border-[#f5f0e8] shadow-sm gap-1">
                              <div>
                                <p className="text-[#3a3226] text-sm font-medium">
                                  {item.action === 'task_created' && 'Task Created'}
                                  {item.action === 'task_edited' && 'Task Edited'}
                                  {item.action === 'progress_updated' && 'Progress Updated'}
                                  {item.action === 'comment_added' && 'Comment Added'}
                                </p>
                                <p className="text-[#7a7067] text-xs">
                                  by {item.user.name}
                                </p>
                              </div>
                              <span className="text-xs text-[#7a7067] bg-[#f5f0e8]/50 px-2 py-1 rounded-full whitespace-nowrap">
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            {item.details && (
                              <p className="text-[#7a7067] text-xs mt-1 ml-1 pl-2 border-l border-[#f5f0e8]">
                                {item.details}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-[#7a7067] bg-white rounded-lg border border-[#f5f0e8]">
                          <ClockIcon className="h-8 w-8 mx-auto mb-2 text-[#f5f0e8]" />
                          <p>No history available for this task.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with sticky positioning - Touch-friendly */}
            <div className="sticky bottom-0 bg-white p-3 md:p-4 border-t border-[#f5f0e8] flex flex-col sm:flex-row gap-2 sm:justify-end shadow-md z-20 mt-auto">
              <button
                className="px-4 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-3 sm:order-1 hover:bg-[#ebe6de] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1 font-medium shadow-sm min-h-[44px]"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>

              {isAdmin() && (
                <>
                  <button
                    className="px-4 py-3 bg-[#f5eee8] text-[#d4a5a5] border border-[#d4a5a5] rounded-lg w-full sm:w-auto order-2 sm:order-2 hover:bg-[#f5e5e5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1 shadow-sm min-h-[44px]"
                    onClick={() => confirmDeleteTask(selectedTask.id, selectedTask.title)}
                  >
                    <div className="flex items-center justify-center">
                      <Trash2Icon className="h-5 w-5 mr-2" />
                      Delete
                    </div>
                  </button>

                  <button
                    className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto order-1 sm:order-3 hover:bg-[#c99595] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:ring-offset-1 font-medium shadow-sm min-h-[44px]"
                    onClick={() => {
                      setEditingTask(selectedTask);
                      setSelectedTask(null);
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <EditIcon className="h-5 w-5 mr-2" />
                      Edit
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Only show edit form if user is admin */}
      {isAdmin() && editingTask && (
        <TaskForm
          onClose={() => setEditingTask(null)}
          onSubmit={(taskData) => {
            // Pass the task data directly with the Date object
            handleEditTask(editingTask.id, taskData);
          }}
          initialTask={editingTask}
        />
      )}

      {/* Progress Update Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isProgressConfirmOpen}
        onClose={() => {
          setIsProgressConfirmOpen(false);
          setPendingProgressUpdate(null);
        }}
        onConfirm={handleConfirmProgressUpdate}
        title={pendingProgressUpdate?.isFirstUpdate ? "Confirm First Progress Update" : "Confirm Progress Update"}
        message={
          pendingProgressUpdate
            ? pendingProgressUpdate.isFirstUpdate
              ? `Just a heads-up — once you change the task from "Not Started" to "${getProgressStateLabel(pendingProgressUpdate.newState)}", there's no going back.

You're basically on the productivity train now, and the only stop ahead is "Completed".

Only admins have the power to rewind things, so make sure you're ready before moving forward.

Ready to keep things moving?`
              : `All done?

Take a quick look — just to be sure.

If everything's wrapped up, go ahead and mark it ${getProgressStateLabel(pendingProgressUpdate.newState)}.

No pressure… but future-you is watching.`
            : "Regular team members can only move progress forward, not backward. Only administrators can move progress in any direction."
        }
        confirmText={pendingProgressUpdate?.isFirstUpdate ? "Yes, Update Progress" : "Yes, Move Forward"}
        cancelText="Cancel"
        type="lock"
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && taskToDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setTaskToDelete(null);
            }
          }}
        >
          <div className="bg-white rounded-xl w-[95%] sm:w-auto sm:min-w-[400px] max-w-[500px] p-6 shadow-xl animate-scaleIn">
            <div className="flex items-start mb-5">
              <div className="bg-[#f5eee8] p-3 rounded-full mr-4 shadow-sm">
                <AlertTriangleIcon className="h-6 w-6 text-[#d4a5a5]" />
              </div>
              <div>
                <h2 className="text-xl text-[#3a3226] font-medium mb-3">Confirm Delete</h2>
                <p className="text-[#7a7067] leading-relaxed">
                  Are you sure you want to delete <span className="font-medium text-[#3a3226]">"{taskToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6 pt-4 border-t border-[#f5f0e8]">
              <button
                className="px-4 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-2 sm:order-1 hover:bg-[#ebe6de] transition-colors font-medium shadow-sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTaskToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-6 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto order-1 sm:order-2 hover:bg-[#c99595] transition-colors font-medium shadow-sm"
                onClick={handleDeleteTask}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default TaskBoard;