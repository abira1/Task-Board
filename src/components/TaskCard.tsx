import React from 'react';
import { CalendarIcon, AlertTriangleIcon } from 'lucide-react';
import Avatar from './Avatar';
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
  return (
    <div className="bg-white rounded-xl p-4 md:p-5 hover:shadow-sm transition-all shadow-sm h-full flex flex-col">
      <h3 className="text-[#3a3226] font-medium text-base md:text-lg mb-3 line-clamp-2">{title}</h3>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center text-[#7a7067] text-xs md:text-sm">
          <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">{dueDate}</span>
        </div>
        <div className={`flex items-center text-xs md:text-sm ${getPriorityColor(priority)}`}>
          <AlertTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{priority}</span>
        </div>
      </div>

      <div className="h-2 bg-[#f5f0e8] rounded-full mb-4">
        <div
          className="h-full rounded-full bg-[#d4a5a5] transition-all duration-300"
          style={{
            width: `${progress}%`
          }}
        ></div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 mt-auto">
        <div className="flex items-center min-w-0">
          <Avatar
            src={assignee.avatar}
            alt={assignee.name}
            size="sm"
            className="mr-2 flex-shrink-0"
          />
          <span className="text-xs md:text-sm text-[#7a7067] truncate">{assignee.name}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${getPriorityBg(priority)} ${getPriorityColor(priority)} whitespace-nowrap`}>
          {progress}% complete
        </div>
      </div>
    </div>
  );
};
export default TaskCard;