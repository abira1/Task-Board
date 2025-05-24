import { useState, useCallback, useRef } from 'react';
import { 
  generatePDF, 
  generateDocumentFilename, 
  prepareElementForPDF, 
  validatePDFRequirements,
  PDFGenerationOptions,
  PDFGenerationProgress 
} from '../utils/pdfGenerator';

export interface PDFDownloadState {
  isGenerating: boolean;
  progress: PDFGenerationProgress | null;
  error: string | null;
}

export interface UsePDFDownloadOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  defaultOptions?: Partial<PDFGenerationOptions>;
}

/**
 * Custom hook for handling PDF download functionality with progress tracking and error handling
 */
export const usePDFDownload = (options: UsePDFDownloadOptions = {}) => {
  const { onSuccess, onError, defaultOptions = {} } = options;
  
  const [state, setState] = useState<PDFDownloadState>({
    isGenerating: false,
    progress: null,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Download PDF from a React ref element
   */
  const downloadPDF = useCallback(async (
    elementRef: React.RefObject<HTMLElement>,
    filename: string,
    customOptions: Partial<PDFGenerationOptions> = {}
  ) => {
    // Validate requirements
    const validation = validatePDFRequirements();
    if (!validation.isValid) {
      const errorMessage = `PDF generation not supported: ${validation.errors.join(', ')}`;
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return;
    }

    // Check if element exists
    if (!elementRef.current) {
      const errorMessage = 'Element not found for PDF generation';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return;
    }

    // Create abort controller for this operation
    abortControllerRef.current = new AbortController();
    
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null,
        progress: {
          stage: 'preparing',
          progress: 0,
          message: 'Starting PDF generation...'
        }
      }));

      // Prepare element for PDF generation
      prepareElementForPDF(elementRef.current);

      // Merge options
      const finalOptions: PDFGenerationOptions = {
        ...defaultOptions,
        ...customOptions,
        filename
      };

      // Generate PDF with progress tracking
      await generatePDF(
        elementRef.current,
        finalOptions,
        (progress) => {
          // Check if operation was aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('PDF generation was cancelled');
          }
          
          setState(prev => ({ ...prev, progress }));
        }
      );

      // Success
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        progress: {
          stage: 'complete',
          progress: 100,
          message: 'PDF downloaded successfully!'
        }
      }));
      
      onSuccess?.();
      
      // Clear progress after a delay
      setTimeout(() => {
        setState(prev => ({ ...prev, progress: null }));
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        error: errorMessage,
        progress: {
          stage: 'error',
          progress: 0,
          message: errorMessage
        }
      }));
      
      onError?.(errorMessage);
      
      // Clear error after a delay
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null, progress: null }));
      }, 5000);
    } finally {
      abortControllerRef.current = null;
    }
  }, [defaultOptions, onSuccess, onError]);

  /**
   * Download invoice PDF
   */
  const downloadInvoicePDF = useCallback(async (
    elementRef: React.RefObject<HTMLElement>,
    invoiceNumber: string,
    clientName?: string,
    customOptions: Partial<PDFGenerationOptions> = {}
  ) => {
    const filename = generateDocumentFilename('invoice', invoiceNumber, clientName);
    await downloadPDF(elementRef, filename, customOptions);
  }, [downloadPDF]);

  /**
   * Download quotation PDF
   */
  const downloadQuotationPDF = useCallback(async (
    elementRef: React.RefObject<HTMLElement>,
    quotationNumber: string,
    clientName?: string,
    customOptions: Partial<PDFGenerationOptions> = {}
  ) => {
    const filename = generateDocumentFilename('quotation', quotationNumber, clientName);
    await downloadPDF(elementRef, filename, customOptions);
  }, [downloadPDF]);

  /**
   * Cancel ongoing PDF generation
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        progress: null,
        error: 'PDF generation cancelled'
      }));
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, progress: null }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancelGeneration();
    setState({
      isGenerating: false,
      progress: null,
      error: null
    });
  }, [cancelGeneration]);

  return {
    // State
    isGenerating: state.isGenerating,
    progress: state.progress,
    error: state.error,
    
    // Actions
    downloadPDF,
    downloadInvoicePDF,
    downloadQuotationPDF,
    cancelGeneration,
    clearError,
    reset
  };
};

/**
 * Hook specifically for invoice PDF downloads
 */
export const useInvoicePDFDownload = (options: UsePDFDownloadOptions = {}) => {
  const pdfHook = usePDFDownload({
    ...options,
    defaultOptions: {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.95,
      margin: 15,
      scale: 2,
      ...options.defaultOptions
    }
  });

  return {
    ...pdfHook,
    downloadInvoicePDF: pdfHook.downloadInvoicePDF
  };
};

/**
 * Hook specifically for quotation PDF downloads
 */
export const useQuotationPDFDownload = (options: UsePDFDownloadOptions = {}) => {
  const pdfHook = usePDFDownload({
    ...options,
    defaultOptions: {
      format: 'a4',
      orientation: 'portrait',
      quality: 0.95,
      margin: 15,
      scale: 2,
      ...options.defaultOptions
    }
  });

  return {
    ...pdfHook,
    downloadQuotationPDF: pdfHook.downloadQuotationPDF
  };
};
