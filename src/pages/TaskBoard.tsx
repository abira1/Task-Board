import React, { useMemo, useState, useEffect } from 'react';
import { PlusIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, XIcon, MinusIcon, PlusCircleIcon, Trash2Icon, AlertTriangleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaskForm from '../components/TaskForm';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultTasks } from '../firebase/initData';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

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

  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      // Ensure assignee has valid data
      const validatedAssignee = ensureValidAssignee(newTask.assignee);

      // Convert Date object to ISO string if it exists
      const taskWithStringDate = {
        ...newTask,
        assignee: validatedAssignee,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        progress: 0
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-[#f5eee8] text-[#d4a5a5]';
      case 'inProgress':
        return 'bg-[#f0f0e8] text-[#b8b87e]';
      case 'done':
        return 'bg-[#e8f3f1] text-[#7eb8ab]';
      default:
        return 'bg-[#f5f0e8] text-[#7a7067]';
    }
  };
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
  const handleProgressUpdate = async (taskId: string, newProgress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Ensure progress stays within bounds
    const boundedProgress = Math.min(100, Math.max(0, newProgress));

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

      // Update task in Firebase
      await updateData('tasks', taskId, {
        progress: boundedProgress,
        status: newStatus
      });

      // Only notify on significant milestones
      if (boundedProgress % 25 === 0 || boundedProgress === 100) {
        await addNotification({
          title: 'Progress Updated',
          message: `${task.title} is now ${boundedProgress}% complete`,
          type: 'task'
        });
      }

      // Update the selected task's progress if it's open
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? {
          ...prev,
          progress: boundedProgress,
          status: newStatus
        } : null);
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };
  const handleEditTask = async (taskId: string, updatedTask: Omit<Task, 'id'>) => {
    try {
      // Ensure assignee has valid data
      const validatedAssignee = ensureValidAssignee(updatedTask.assignee);

      // Convert Date object to ISO string if it exists
      const taskWithStringDate = {
        ...updatedTask,
        assignee: validatedAssignee,
        dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString() : undefined
      };

      // Update task in Firebase
      await updateData('tasks', taskId, taskWithStringDate);

      setEditingTask(null);

      // Add notification
      await addNotification({
        title: 'Task Updated',
        message: `Task "${updatedTask.title}" has been updated`,
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
        <div className="space-y-6">
          {Object.entries(tasksByMember).map(([memberName, {
          avatar,
          tasks
        }]) => (
            <div key={memberName} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-[#f5f0e8]/30 transition-colors"
                onClick={() => toggleMemberExpanded(memberName)}
                aria-expanded={expandedMembers.includes(memberName)}
                aria-controls={`tasks-${memberName.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center">
                  <Avatar
                    src={avatar}
                    alt={memberName}
                    size="lg"
                    className="mr-4"
                  />
                  <div>
                    <h3 className="text-[#3a3226] font-medium text-lg">{memberName}</h3>
                    <p className="text-sm text-[#7a7067]">
                      {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedMembers.includes(memberName) ?
                  <ChevronUpIcon className="h-6 w-6 text-[#7a7067]" /> :
                  <ChevronDownIcon className="h-6 w-6 text-[#7a7067]" />
                }
              </button>

              {expandedMembers.includes(memberName) && (
                <div
                  id={`tasks-${memberName.replace(/\s+/g, '-').toLowerCase()}`}
                  className="p-4 border-t border-[#f5f0e8] space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-[#f5f0e8]/30 rounded-lg p-4 hover:bg-[#f5f0e8]/50 transition-colors h-full flex flex-col relative group"
                      >
                        {/* Task content - clickable */}
                        <div
                          className="flex-grow cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-[#3a3226] font-medium text-base">
                              {task.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)} whitespace-nowrap ml-2`}>
                              {task.status === 'inProgress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                            </span>
                          </div>
                          <p className="text-sm text-[#7a7067] mb-4 line-clamp-3 flex-grow">
                            {task.description}
                          </p>
                        </div>

                        {/* Task footer */}
                        <div className="flex flex-wrap justify-between items-center gap-2 mt-auto">
                          <div className="flex items-center">
                            <Avatar
                              src={task.assignee.avatar}
                              alt={task.assignee.name}
                              size="xs"
                              className="mr-2"
                            />
                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority} Priority
                            </span>
                          </div>
                          {task.dueDate && (
                            <span className="text-xs text-[#7a7067]">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Admin actions - only visible on hover */}
                        {isAdmin() && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1.5 bg-white rounded-full text-[#d4a5a5] hover:text-[#c99595] shadow-sm"
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
      {isAddTaskModalOpen && <TaskForm onClose={() => setIsAddTaskModalOpen(false)} onSubmit={handleAddTask} />}
      {/* Task Detail Modal - Full screen on mobile, centered on desktop */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[480px] md:max-w-[600px] md:rounded-xl overflow-auto">
            {/* Modal Header with sticky positioning */}
            <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-[#f5f0e8] flex justify-between items-center z-10">
              <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
                Task Details
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067] hover:text-[#3a3226] transition-colors"
                aria-label="Close task details"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content with padding and scrollable area */}
            <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-[#3a3226] font-medium text-xl mb-3">
                  {selectedTask.title}
                </h3>
                <p className="text-[#7a7067] text-base">
                  {selectedTask.description}
                </p>
              </div>

              {/* Task Metadata */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className={`text-sm font-medium ${getPriorityColor(selectedTask.priority)} px-3 py-1.5 bg-[#f5f0e8] rounded-lg`}>
                  {selectedTask.priority} Priority
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-sm ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status === 'inProgress' ? 'In Progress' : selectedTask.status === 'todo' ? 'To Do' : 'Done'}
                </span>
                {selectedTask.dueDate && (
                  <span className="text-sm text-[#7a7067] px-3 py-1.5 bg-[#f5f0e8] rounded-lg">
                    Due: {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Assignee Information */}
              <div className="flex items-center p-4 bg-[#f5f0e8]/30 rounded-lg">
                <Avatar
                  src={selectedTask.assignee.avatar}
                  alt={selectedTask.assignee.name}
                  size="lg"
                  className="mr-4"
                />
                <div>
                  <p className="text-[#3a3226] font-medium">Assigned to</p>
                  <p className="text-[#7a7067]">{selectedTask.assignee.name}</p>
                </div>
              </div>

              {/* Progress Update Section - Only show if user is admin or task assignee */}
              {canUpdateProgress(selectedTask) && (
                <div className="space-y-4 border-t border-[#f5f0e8] pt-6">
                  <div className="flex justify-between items-center">
                    <label className="text-base text-[#3a3226] font-medium">
                      Update Progress
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProgressUpdate(selectedTask.id, (selectedTask.progress || 0) - 5)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067]"
                        aria-label="Decrease progress"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      <span className="text-base text-[#3a3226] font-medium w-16 text-center">
                        {selectedTask.progress || 0}%
                      </span>
                      <button
                        onClick={() => handleProgressUpdate(selectedTask.id, (selectedTask.progress || 0) + 5)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] text-[#7a7067]"
                        aria-label="Increase progress"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-[#f5f0e8] rounded-full">
                    <div
                      className="h-full rounded-full bg-[#d4a5a5] transition-all duration-300"
                      style={{
                        width: `${selectedTask.progress || 0}%`
                      }}
                    ></div>
                  </div>

                  {/* Quick Progress Buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[0, 25, 50, 75, 100].map(progress => (
                      <button
                        key={progress}
                        onClick={() => handleProgressUpdate(selectedTask.id, progress)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          (selectedTask.progress || 0) === progress
                            ? 'bg-[#d4a5a5] text-white'
                            : 'bg-[#f5f0e8] text-[#7a7067] hover:bg-[#f5eee8]'
                        }`}
                      >
                        {progress}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show read-only progress if user can't update */}
              {!canUpdateProgress(selectedTask) && (
                <div className="space-y-3 border-t border-[#f5f0e8] pt-6">
                  <div className="flex justify-between items-center">
                    <label className="text-base text-[#3a3226] font-medium">
                      Current Progress
                    </label>
                    <span className="text-base text-[#3a3226] font-medium">
                      {selectedTask.progress || 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-[#f5f0e8] rounded-full">
                    <div
                      className="h-full rounded-full bg-[#d4a5a5] transition-all duration-300"
                      style={{
                        width: `${selectedTask.progress || 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with sticky positioning */}
            <div className="sticky bottom-0 bg-white p-4 md:p-6 border-t border-[#f5f0e8] flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                className="px-4 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-3 sm:order-1"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>

              {isAdmin() && (
                <>
                  <button
                    className="px-4 py-3 bg-[#f5eee8] text-[#d4a5a5] border border-[#d4a5a5] rounded-lg w-full sm:w-auto order-2 sm:order-2 hover:bg-[#f5e5e5] transition-colors"
                    onClick={() => confirmDeleteTask(selectedTask.id, selectedTask.title)}
                  >
                    Delete Task
                  </button>

                  <button
                    className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto order-1 sm:order-3"
                    onClick={() => {
                      setEditingTask(selectedTask);
                      setSelectedTask(null);
                    }}
                  >
                    Edit Task
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Only show edit form if user is admin */}
      {isAdmin() && editingTask && <TaskForm onClose={() => setEditingTask(null)} onSubmit={updatedTask => handleEditTask(editingTask.id, updatedTask)} initialTask={editingTask} />}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
            <div className="flex items-start mb-4">
              <div className="bg-[#f5eee8] p-3 rounded-full mr-4">
                <AlertTriangleIcon className="h-6 w-6 text-[#d4a5a5]" />
              </div>
              <div>
                <h2 className="text-xl text-[#3a3226] font-medium mb-2">Confirm Delete</h2>
                <p className="text-[#7a7067]">
                  Are you sure you want to delete <span className="font-medium">"{taskToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6">
              <button
                className="px-4 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg w-full sm:w-auto order-2 sm:order-1 hover:bg-[#ebe6de] transition-colors"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTaskToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 bg-[#d4a5a5] text-white rounded-lg w-full sm:w-auto order-1 sm:order-2 hover:bg-[#c99595] transition-colors"
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