import React from 'react';
import { CalendarIcon, AlertTriangleIcon, ListTodoIcon, BarChart3Icon, CheckCircleIcon } from 'lucide-react';
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
        return 'bg-[#f5eee8]';
      case 'Low':
        return 'bg-[#f5eee8]';
      default:
        return 'bg-[#f5eee8]';
    }
  };
  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 hover:bg-[#f5f0e8]/20 transition-all duration-200 shadow-sm hover:shadow-md h-full flex flex-col border border-[#f5f0e8]">
      {/* Header with priority indicator */}
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
          priority === 'High' ? 'bg-[#d4a5a5]' : 
          priority === 'Medium' ? 'bg-[#b8b87e]' : 
          'bg-[#7eb8ab]'
        }`}></div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#3a3226] font-medium text-sm md:text-lg mb-1 line-clamp-2 leading-tight">{title}</h3>
          <div className="flex items-center gap-1.5 text-[#7a7067] text-xs">
            <CalendarIcon className="h-3 w-3 flex-shrink-0 text-[#d4a5a5]" />
            <span className="truncate text-xs-mobile md:text-xs">{dueDate}</span>
          </div>
        </div>
      </div>

      {/* Compact progress bar */}
      <div className="h-1.5 bg-[#f5f0e8] rounded-full mb-2.5 border border-[#f5f0e8]/50">
        <div
          className="h-full rounded-full bg-[#d4a5a5] transition-all duration-300"
          style={{
            width: `${progress}%`
          }}
        ></div>
      </div>

      {/* Footer with assignee and status */}
      <div className="flex justify-between items-center gap-2 mt-auto pt-2 border-t border-[#f5f0e8]">
        <div className="flex items-center min-w-0 gap-1.5">
          <Avatar
            src={assignee.avatar}
            alt={assignee.name}
            size="sm"
            className="flex-shrink-0 border border-[#d4a5a5]/20 w-6 h-6 md:w-8 md:h-8"
          />
          <span className="text-xs-mobile md:text-xs text-[#7a7067] truncate">{assignee.name}</span>
        </div>
        <div className="px-2 py-1 rounded-full text-[10px] md:text-xs font-medium flex items-center bg-[#f5eee8] text-[#d4a5a5] border border-[#d4a5a5]/20 whitespace-nowrap">
          {progress === 0 ? (
            <><ListTodoIcon className="h-3 w-3 mr-1 text-[#d4a5a5]" /><span className="hidden sm:inline">Not Started</span><span className="sm:hidden">0%</span></>
          ) : progress === 50 ? (
            <><BarChart3Icon className="h-3 w-3 mr-1 text-[#d4a5a5]" /><span className="hidden sm:inline">In Progress</span><span className="sm:hidden">50%</span></>
          ) : (
            <><CheckCircleIcon className="h-3 w-3 mr-1 text-[#d4a5a5]" /><span className="hidden sm:inline">Completed</span><span className="sm:hidden">100%</span></>
          )}
        </div>
      </div>
    </div>
  );
};
export default TaskCard;