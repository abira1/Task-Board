import React from 'react';
import { XIcon, CheckIcon, DownloadIcon, AlertCircleIcon } from 'lucide-react';
import { OperatingSystem, getOperatingSystemName } from '../utils/platformDetection';
import { getPlatformInstructions } from '../utils/shortcutGenerator';

interface InstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
  os: OperatingSystem;
  onDownload: () => void;
  isDownloading: boolean;
  downloadSuccess: boolean | null;
  downloadError: string | null;
}

const InstallationModal: React.FC<InstallationModalProps> = ({
  isOpen,
  onClose,
  os,
  onDownload,
  isDownloading,
  downloadSuccess,
  downloadError
}) => {
  if (!isOpen) return null;

  const { title, steps } = getPlatformInstructions(os);
  const osName = getOperatingSystemName(os);
  const isMobile = os === 'ios' || os === 'android';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 modal-overlay">
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#f5f0e8] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#3a3226]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#f5f0e8] transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5 text-[#7a7067]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-[#7a7067] mb-4">
            We've detected you're using <span className="font-medium text-[#3a3226]">{osName}</span>.
            Follow these steps to install Toiral Task Board:
          </p>

          {/* Download button for desktop platforms */}
          {!isMobile && (
            <div className="mb-6">
              <button
                onClick={onDownload}
                disabled={isDownloading || downloadSuccess === true}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg ${
                  downloadSuccess === true
                    ? 'bg-green-500 text-white'
                    : 'bg-[#d4a5a5] hover:bg-[#c99595] text-white'
                } transition-colors disabled:opacity-70`}
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Generating shortcut...</span>
                  </>
                ) : downloadSuccess === true ? (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    <span>Shortcut Downloaded</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    <span>Download Shortcut File</span>
                  </>
                )}
              </button>

              {downloadError && (
                <div className="mt-2 p-2 bg-red-50 text-red-600 rounded-md text-sm flex items-start">
                  <AlertCircleIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}
            </div>
          )}

          {/* Installation steps */}
          <ol className="list-decimal pl-5 space-y-3 text-[#7a7067]">
            {steps.map((step, index) => (
              <li key={index} className="pl-1">{step}</li>
            ))}
          </ol>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-[#f5f0e8] rounded-lg">
            <p className="text-[#3a3226] font-medium mb-2">Benefits of installing as an app:</p>
            <ul className="list-disc pl-5 text-[#7a7067] space-y-1">
              <li>Faster access with a dedicated icon</li>
              <li>Full-screen experience without browser controls</li>
              <li>Work offline when needed</li>
              <li>Improved performance</li>
              <li>Automatic updates</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#f5f0e8] flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-[#f5f0e8] hover:bg-[#e9e4dc] text-[#3a3226] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallationModal;
