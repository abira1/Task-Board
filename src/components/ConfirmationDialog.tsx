import React from 'react';
import { XIcon, AlertTriangleIcon, LockIcon, UnlockIcon } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'lock';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'lock':
        return <LockIcon className="h-10 w-10 text-[#d4a5a5]" />;
      case 'danger':
        return <AlertTriangleIcon className="h-10 w-10 text-[#e57373]" />;
      case 'info':
        return <UnlockIcon className="h-10 w-10 text-[#7eb8ab]" />;
      case 'warning':
      default:
        return <AlertTriangleIcon className="h-10 w-10 text-[#b8b87e]" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'lock':
        return 'bg-[#d4a5a5] hover:bg-[#c99595]';
      case 'danger':
        return 'bg-[#e57373] hover:bg-[#d96666]';
      case 'info':
        return 'bg-[#7eb8ab] hover:bg-[#6ea99c]';
      case 'warning':
      default:
        return 'bg-[#b8b87e] hover:bg-[#a9a96f]';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl w-full max-w-md p-6 md:p-8 shadow-lg animate-scaleIn">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-medium text-xl text-[#3a3226]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#7a7067] hover:text-[#3a3226] transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="mb-5">
            {getIcon()}
          </div>
          <div className="text-center text-[#3a3226] whitespace-pre-line leading-relaxed px-2">{message}</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#7a7067] bg-[#f5f0e8] rounded-lg hover:bg-[#ebe6de] transition-colors order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors order-1 sm:order-2 ${getConfirmButtonStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
