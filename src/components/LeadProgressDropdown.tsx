import React, { useState } from 'react';
import { ChevronDownIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';
import { Lead } from '../contexts/LeadContext';
import { useNotifications } from '../contexts/NotificationContext';

interface LeadProgressDropdownProps {
  lead: Lead;
  onProgressUpdate: (leadId: string, progress: Lead['progress']) => Promise<void>;
  disabled?: boolean;
}

const LeadProgressDropdown: React.FC<LeadProgressDropdownProps> = ({
  lead,
  onProgressUpdate,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotifications();

  const progressOptions: { value: Lead['progress']; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: 'Untouched',
      label: 'Untouched',
      icon: <XCircleIcon className="h-4 w-4" />,
      color: 'bg-[#e8f3f1] text-[#7eb8ab]'
    },
    {
      value: 'Knocked',
      label: 'Knocked',
      icon: <ClockIcon className="h-4 w-4" />,
      color: 'bg-[#f0f0e8] text-[#b8b87e]'
    },
    {
      value: 'In Progress',
      label: 'In Progress',
      icon: <ClockIcon className="h-4 w-4" />,
      color: 'bg-[#f0f0e8] text-[#b8b87e]'
    },
    {
      value: 'Confirm',
      label: 'Confirm',
      icon: <CheckCircleIcon className="h-4 w-4" />,
      color: 'bg-[#f5eee8] text-[#d4a5a5]'
    },
    {
      value: 'Canceled',
      label: 'Canceled',
      icon: <XCircleIcon className="h-4 w-4" />,
      color: 'bg-[#f8e8e8] text-[#e57373]'
    }
  ];

  const currentOption = progressOptions.find(option => option.value === lead.progress);

  const handleProgressChange = async (newProgress: Lead['progress']) => {
    if (newProgress === lead.progress || isUpdating) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      await onProgressUpdate(lead.id, newProgress);
      
      await addNotification({
        title: 'Lead Progress Updated',
        message: `${lead.companyName} progress changed to ${newProgress}`,
        type: 'team'
      });
    } catch (error) {
      console.error('Error updating lead progress:', error);
      await addNotification({
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update lead progress',
        type: 'system'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (disabled) {
    return (
      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${currentOption?.color || 'bg-[#f5f0e8] text-[#7a7067]'}`}>
        {currentOption?.icon}
        <span className="ml-1">{currentOption?.label || lead.progress}</span>
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isUpdating) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isUpdating}
        className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full transition-all duration-200 ${
          currentOption?.color || 'bg-[#f5f0e8] text-[#7a7067]'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
        title="Click to change progress status"
      >
        {isUpdating ? (
          <>
            <span className="animate-spin mr-1">⏳</span>
            <span>Updating...</span>
          </>
        ) : (
          <>
            {currentOption?.icon}
            <span className="ml-1">{currentOption?.label || lead.progress}</span>
            <ChevronDownIcon className="h-3 w-3 ml-1" />
          </>
        )}
      </button>

      {isOpen && !isUpdating && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#f5f0e8] rounded-lg shadow-lg z-20 overflow-hidden">
            {progressOptions.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProgressChange(option.value);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center transition-colors ${
                  option.value === lead.progress
                    ? 'bg-[#f5f0e8] text-[#3a3226]'
                    : 'hover:bg-[#f9f6f1] text-[#7a7067]'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 ${option.color}`}>
                  {option.icon}
                </span>
                {option.label}
                {option.value === lead.progress && (
                  <CheckCircleIcon className="h-3 w-3 ml-auto text-[#d4a5a5]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LeadProgressDropdown;
