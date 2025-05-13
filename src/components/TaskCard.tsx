import React from 'react';
import { CalendarIcon, AlertTriangleIcon } from 'lucide-react';
interface Assignee {
  name: string;
  avatar: string;
}
interface TaskCardProps {
  title: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  assignee: Assignee;
  progress: number;
}
const TaskCard: React.FC<TaskCardProps> = ({
  title,
  dueDate,
  priority,
  assignee,
  progress
}) => {
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
  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-[#f5eee8]';
      case 'Medium':
        return 'bg-[#f0f0e8]';
      case 'Low':
        return 'bg-[#e8f3f1]';
      default:
        return 'bg-[#f5f0e8]';
    }
  };
  return <div className="bg-white rounded-xl p-5 hover:shadow-sm transition-all">
      <h3 className="text-[#3a3226] font-medium mb-3">{title}</h3>
      <div className="flex items-center mb-4">
        <div className="flex items-center text-[#7a7067] text-sm mr-4">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{dueDate}</span>
        </div>
        <div className={`flex items-center text-sm ${getPriorityColor(priority)}`}>
          <AlertTriangleIcon className="h-4 w-4 mr-1" />
          <span>{priority}</span>
        </div>
      </div>
      <div className="h-2 bg-[#f5f0e8] rounded-full mb-4">
        <div className="h-full rounded-full bg-[#d4a5a5]" style={{
        width: `${progress}%`
      }}></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full mr-2" />
          <span className="text-sm text-[#7a7067]">{assignee.name}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs ${getPriorityBg(priority)} ${getPriorityColor(priority)}`}>
          {progress}% complete
        </div>
      </div>
    </div>;
};
export default TaskCard;