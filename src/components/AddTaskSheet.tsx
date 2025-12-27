import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import TaskForm from './TaskForm';
import { addData } from '../firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchData } from '../firebase/database';

interface AddTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
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

const AddTaskSheet: React.FC<AddTaskSheetProps> = ({ open, onOpenChange }) => {
  const { user, isAdmin } = useAuth();
  const { addNotification } = useNotifications();
  const [users, setUsers] = React.useState<User[]>([]);

  // Fetch users from Firebase
  React.useEffect(() => {
    const unsubscribe = fetchData<User[]>('users', (data) => {
      if (data) {
        const approvedUsers = data.filter(user =>
          user.approvalStatus === 'approved' || user.role === 'admin'
        );
        setUsers(approvedUsers);
      } else {
        setUsers([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper function to ensure assignee avatar is valid
  const ensureValidAssignee = (assignee: { name: string; avatar: string }) => {
    return {
      name: assignee.name || 'Unassigned',
      avatar: assignee.avatar || ''
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
    assignees?: Array<{
      name: string;
      avatar: string;
    }>;
    assignmentMode?: 'single' | 'multiple';
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
        details: newTaskFormData.assignmentMode === 'multiple' && newTaskFormData.assignees 
          ? `Task was created and assigned to ${newTaskFormData.assignees.length} member(s)`
          : 'Task was created'
      };

      // Convert Date object to ISO string if it exists
      const taskWithStringDate: any = {
        ...newTaskFormData,
        assignee: validatedAssignee,
        dueDate: newTaskFormData.dueDate ? newTaskFormData.dueDate.toISOString() : undefined,
        progress: 0, // Not Started
        createdAt: now,
        updatedAt: now,
        history: [historyItem]
      };

      // Add assignees if multiple assignment mode
      if (newTaskFormData.assignmentMode === 'multiple' && newTaskFormData.assignees) {
        taskWithStringDate.assignees = newTaskFormData.assignees;
      }

      // Add task to Firebase
      await addData('tasks', taskWithStringDate);

      onOpenChange(false);

      // Add notification to assigned members
      if (isAdmin()) {
        if (newTaskFormData.assignmentMode === 'multiple' && newTaskFormData.assignees) {
          // Send notification to all assigned members
          for (const assignee of newTaskFormData.assignees) {
            const assignedUser = users.find(u => u.name === assignee.name);
            if (assignedUser) {
              await addNotification({
                title: 'New Task Assigned',
                message: `You have been assigned the task: "${taskWithStringDate.title}"`,
                type: 'task',
                targetUserId: assignedUser.id
              });
            }
          }
        } else {
          // Send notification to single assignee
          const assignedUser = users.find(u => u.name === taskWithStringDate.assignee.name);
          if (assignedUser) {
            await addNotification({
              title: 'New Task Assigned',
              message: `You have been assigned the task: "${taskWithStringDate.title}"`,
              type: 'task',
              targetUserId: assignedUser.id
            });
          }
        }
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-2xl overflow-hidden"
        data-testid="add-task-sheet"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-['Caveat',_cursive] text-[#3a3226]">
            Add New Task
          </SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(80vh-80px)]">
          <TaskForm 
            onClose={() => onOpenChange(false)}
            onSubmit={(taskData) => {
              handleAddTask(taskData);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddTaskSheet;
