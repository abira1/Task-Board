import React from 'react';
import { CheckCircleIcon, XCircleIcon, Loader2Icon, DownloadIcon, AlertCircleIcon } from 'lucide-react';
import { PDFGenerationProgress } from '../utils/pdfGenerator';

interface PDFProgressIndicatorProps {
  progress: PDFGenerationProgress | null;
  isGenerating: boolean;
  error: string | null;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

/**
 * Component to display PDF generation progress with visual feedback
 */
const PDFProgressIndicator: React.FC<PDFProgressIndicatorProps> = ({
  progress,
  isGenerating,
  error,
  onClose,
  onRetry,
  className = ''
}) => {
  // Don't render if no progress and not generating
  if (!progress && !isGenerating && !error) {
    return null;
  }

  const getStageIcon = () => {
    if (error || progress?.stage === 'error') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
    
    if (progress?.stage === 'complete') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    
    if (isGenerating || progress) {
      return <Loader2Icon className="h-5 w-5 text-[#d4a5a5] animate-spin" />;
    }
    
    return <DownloadIcon className="h-5 w-5 text-[#7a7067]" />;
  };

  const getStageColor = () => {
    if (error || progress?.stage === 'error') {
      return 'bg-red-50 border-red-400';
    }
    
    if (progress?.stage === 'complete') {
      return 'bg-green-50 border-green-400';
    }
    
    return 'bg-[#f5f0e8] border-[#d4a5a5]';
  };

  const getTextColor = () => {
    if (error || progress?.stage === 'error') {
      return 'text-red-800';
    }
    
    if (progress?.stage === 'complete') {
      return 'text-green-800';
    }
    
    return 'text-[#3a3226]';
  };

  const getMessage = () => {
    if (error) {
      return error;
    }
    
    if (progress?.message) {
      return progress.message;
    }
    
    if (isGenerating) {
      return 'Generating PDF...';
    }
    
    return 'Ready to generate PDF';
  };

  const getProgressPercentage = () => {
    if (progress?.progress !== undefined) {
      return Math.max(0, Math.min(100, progress.progress));
    }
    return 0;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
      <div className={`${getStageColor()} border-l-4 p-4 rounded shadow-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {getStageIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-medium ${getTextColor()}`}>
                PDF Generation
              </p>
              {(onClose || onRetry) && (
                <div className="flex space-x-1">
                  {onRetry && (error || progress?.stage === 'error') && (
                    <button
                      onClick={onRetry}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Retry
                    </button>
                  )}
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <p className={`text-xs ${getTextColor()} mb-2`}>
              {getMessage()}
            </p>
            
            {/* Progress Bar */}
            {(isGenerating || progress) && progress?.stage !== 'complete' && progress?.stage !== 'error' && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-[#d4a5a5] h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}
            
            {/* Stage Indicators */}
            {progress && (
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className={progress.stage === 'preparing' ? 'text-[#d4a5a5] font-medium' : ''}>
                  Preparing
                </span>
                <span className={progress.stage === 'capturing' ? 'text-[#d4a5a5] font-medium' : ''}>
                  Capturing
                </span>
                <span className={progress.stage === 'generating' ? 'text-[#d4a5a5] font-medium' : ''}>
                  Generating
                </span>
                <span className={progress.stage === 'downloading' ? 'text-[#d4a5a5] font-medium' : ''}>
                  Downloading
                </span>
              </div>
            )}
            
            {/* Error Details */}
            {(error || progress?.stage === 'error') && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                <div className="flex items-start">
                  <AlertCircleIcon className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>
                    {error || progress?.message || 'An error occurred during PDF generation'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {progress?.stage === 'complete' && (
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  <span>PDF downloaded successfully!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFProgressIndicator;
