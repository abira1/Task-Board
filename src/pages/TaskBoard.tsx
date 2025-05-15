import React, { useMemo, useState, useEffect } from 'react';
import { PlusIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, XIcon, MinusIcon, PlusCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaskForm from '../components/TaskForm';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultTasks } from '../firebase/initData';
import { useLocation, useNavigate } from 'react-router-dom';

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

  // Fetch tasks from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Task[]>('tasks', (data) => {
      if (data) {
        setTasks(data);

        // Check for task ID in URL query parameter
        const params = new URLSearchParams(location.search);
        const taskId = params.get('task');

        if (taskId) {
          const task = data.find(t => t.id === taskId);
          if (task) {
            setSelectedTask(task);

            // Expand the member section for this task
            if (task.assignee && task.assignee.name) {
              setExpandedMembers(prev =>
                prev.includes(task.assignee.name) ? prev : [...prev, task.assignee.name]
              );
            }

            // Clear the URL parameter after handling it
            navigate('/task-board', { replace: true });
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
  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      // Convert Date object to ISO string if it exists
      const taskWithStringDate = {
        ...newTask,
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
      // Convert Date object to ISO string if it exists
      const taskWithStringDate = {
        ...updatedTask,
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
  return <div>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
            Task Board
          </h1>
          <p className="text-[#7a7067]">View and manage tasks by team member</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <div className="flex gap-2">
            <select className="bg-white text-[#7a7067] px-4 py-2 rounded-lg border border-[#f5f0e8]" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <select className="bg-white text-[#7a7067] px-4 py-2 rounded-lg border border-[#f5f0e8]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          {isAdmin() && <button className="flex items-center px-4 py-2 bg-[#d4a5a5] text-white rounded-lg" onClick={() => setIsAddTaskModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              <span>Add Task</span>
            </button>}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-[#7a7067]">Loading tasks...</div>
        </div>
      ) : Object.keys(tasksByMember).length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-[#7a7067] mb-4">No tasks found.</p>
          {isAdmin() && (
            <button
              className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg"
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
        }]) => <div key={memberName} className="bg-white rounded-xl overflow-hidden">
                <button className="w-full p-4 flex items-center justify-between hover:bg-[#f5f0e8]/30" onClick={() => toggleMemberExpanded(memberName)}>
                  <div className="flex items-center">
                    <img src={avatar} alt={memberName} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <h3 className="text-[#3a3226] font-medium">{memberName}</h3>
                      <p className="text-sm text-[#7a7067]">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {expandedMembers.includes(memberName) ? <ChevronUpIcon className="h-5 w-5 text-[#7a7067]" /> : <ChevronDownIcon className="h-5 w-5 text-[#7a7067]" />}
                </button>
                {expandedMembers.includes(memberName) && <div className="p-4 border-t border-[#f5f0e8] space-y-4">
                    {tasks.map(task => <div key={task.id} className="bg-[#f5f0e8]/30 rounded-lg p-4 hover:bg-[#f5f0e8]/50 cursor-pointer" onClick={() => setSelectedTask(task)}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[#3a3226] font-medium">
                            {task.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                            {task.status === 'inProgress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                          </span>
                        </div>
                        <p className="text-sm text-[#7a7067] mb-3 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                          </span>
                          {task.dueDate && <span className="text-xs text-[#7a7067]">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>}
                        </div>
                      </div>)}
                  </div>}
              </div>)}
        </div>
      )}
      {isAddTaskModalOpen && <TaskForm onClose={() => setIsAddTaskModalOpen(false)} onSubmit={handleAddTask} />}
      {selectedTask && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
                Task Details
              </h2>
              <button onClick={() => setSelectedTask(null)} className="text-[#7a7067] hover:text-[#3a3226]">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-[#3a3226] font-medium">
                  {selectedTask.title}
                </h3>
                <p className="text-[#7a7067] mt-2">
                  {selectedTask.description}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority} Priority
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status === 'inProgress' ? 'In Progress' : selectedTask.status === 'todo' ? 'To Do' : 'Done'}
                </span>
              </div>
              {/* Progress Update Section - Only show if user is admin or task assignee */}
              {canUpdateProgress(selectedTask) && <div className="space-y-2 border-t border-[#f5f0e8] pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-[#3a3226] font-medium">
                      Progress
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleProgressUpdate(selectedTask.id, (selectedTask.progress || 0) - 5)} className="p-1 rounded hover:bg-[#f5f0e8] text-[#7a7067]">
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-[#3a3226] font-medium w-12 text-center">
                        {selectedTask.progress || 0}%
                      </span>
                      <button onClick={() => handleProgressUpdate(selectedTask.id, (selectedTask.progress || 0) + 5)} className="p-1 rounded hover:bg-[#f5f0e8] text-[#7a7067]">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-[#f5f0e8] rounded-full">
                    <div className="h-full rounded-full bg-[#d4a5a5] transition-all duration-300" style={{
                width: `${selectedTask.progress || 0}%`
              }}></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[0, 25, 50, 75, 100].map(progress => <button key={progress} onClick={() => handleProgressUpdate(selectedTask.id, progress)} className={`px-2 py-1 rounded text-xs ${(selectedTask.progress || 0) === progress ? 'bg-[#d4a5a5] text-white' : 'bg-[#f5f0e8] text-[#7a7067] hover:bg-[#f5eee8]'}`}>
                        {progress}%
                      </button>)}
                  </div>
                </div>}
              {/* Show read-only progress if user can't update */}
              {!canUpdateProgress(selectedTask) && <div className="space-y-2 border-t border-[#f5f0e8] pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-[#3a3226] font-medium">
                      Progress
                    </label>
                    <span className="text-sm text-[#3a3226] font-medium">
                      {selectedTask.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#f5f0e8] rounded-full">
                    <div className="h-full rounded-full bg-[#d4a5a5] transition-all duration-300" style={{
                width: `${selectedTask.progress || 0}%`
              }}></div>
                  </div>
                </div>}
              <div className="flex justify-end space-x-3 mt-6">
                <button className="px-4 py-2 text-[#7a7067] bg-[#f5f0e8] rounded-lg" onClick={() => setSelectedTask(null)}>
                  Close
                </button>
                {isAdmin() && <button className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg" onClick={() => {
              setEditingTask(selectedTask);
              setSelectedTask(null);
            }}>
                    Edit Task
                  </button>}
              </div>
            </div>
          </div>
        </div>}
      {/* Only show edit form if user is admin */}
      {isAdmin() && editingTask && <TaskForm onClose={() => setEditingTask(null)} onSubmit={updatedTask => handleEditTask(editingTask.id, updatedTask)} initialTask={editingTask} />}
    </div>;
};
export default TaskBoard;