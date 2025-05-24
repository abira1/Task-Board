import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface SaveFeedbackProps {
  status: SaveStatus;
  message?: string;
  error?: string;
  onClose?: () => void;
  autoHideDuration?: number;
}

/**
 * Component to provide visual feedback during save operations
 */
const SaveFeedback: React.FC<SaveFeedbackProps> = ({
  status,
  message,
  error,
  onClose,
  autoHideDuration = 3000
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Show the feedback when status changes to saving, success, or error
    if (status !== 'idle') {
      setVisible(true);
    }
    
    // Auto-hide on success after the specified duration
    if (status === 'success' && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [status, autoHideDuration, onClose]);
  
  // Don't render anything if not visible
  if (!visible) return null;
  
  // Determine the appropriate styles and content based on status
  let bgColor = 'bg-[#f5f0e8]';
  let textColor = 'text-[#3a3226]';
  let borderColor = 'border-[#d4a5a5]';
  let icon = null;
  let displayMessage = message || '';
  
  switch (status) {
    case 'saving':
      displayMessage = message || 'Saving...';
      icon = <Loader2Icon className="h-5 w-5 text-[#d4a5a5] animate-spin" />;
      break;
    case 'success':
      bgColor = 'bg-green-50';
      borderColor = 'border-green-400';
      textColor = 'text-green-800';
      displayMessage = message || 'Saved successfully!';
      icon = <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      break;
    case 'error':
      bgColor = 'bg-red-50';
      borderColor = 'border-red-400';
      textColor = 'text-red-800';
      displayMessage = message || 'Error saving data';
      icon = <XCircleIcon className="h-5 w-5 text-red-500" />;
      break;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className={`${bgColor} ${borderColor} border-l-4 p-4 rounded shadow-md`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {icon}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor}`}>{displayMessage}</p>
            {error && status === 'error' && (
              <p className="mt-1 text-xs text-red-700">{error}</p>
            )}
          </div>
          {(status === 'success' || status === 'error') && (
            <div className="ml-4">
              <button
                onClick={() => {
                  setVisible(false);
                  if (onClose) onClose();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveFeedback;
