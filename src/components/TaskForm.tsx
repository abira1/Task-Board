import React, { useState } from 'react';
import { XIcon } from 'lucide-react';

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
  progress?: number;
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assigneeMap = {
      'Emma Chen': {
        name: 'Emma Chen',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      'Alex Kim': {
        name: 'Alex Kim',
        avatar: 'https://i.pravatar.cc/150?img=11'
      },
      'Jordan Lee': {
        name: 'Jordan Lee',
        avatar: 'https://i.pravatar.cc/150?img=32'
      }
    };
    onSubmit({
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignee: assigneeMap[assignee as keyof typeof assigneeMap]
    });
    onClose();
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            {initialTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="text-[#7a7067] hover:text-[#3a3226]">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Title
            </label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Enter task title" required />
          </div>
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Description
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[100px]" placeholder="Enter task description" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Priority
              </label>
              <select value={priority} onChange={e => setPriority(e.target.value as 'Low' | 'Medium' | 'High')} className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" required>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Status
              </label>
              <select value={status} onChange={e => setStatus(e.target.value as 'todo' | 'inProgress' | 'done')} className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" required>
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
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" />
          </div>
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Assignee
            </label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)} className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" required>
              <option value="">Select assignee</option>
              <option value="Emma Chen">Emma Chen</option>
              <option value="Alex Kim">Alex Kim</option>
              <option value="Jordan Lee">Jordan Lee</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[#7a7067] bg-[#f5f0e8] rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg">
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export default TaskForm;