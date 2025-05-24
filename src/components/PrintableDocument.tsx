import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PrinterIcon, DownloadIcon, XIcon, Share2Icon, Loader2Icon } from 'lucide-react';
import PDFProgressIndicator from './PDFProgressIndicator';
import { useInvoicePDFDownload, useQuotationPDFDownload } from '../hooks/usePDFDownload';

interface PrintableDocumentProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  documentType: 'invoice' | 'quotation';
  onDownloadPdf?: () => void;
  onShare?: () => void;
  // Enhanced props for PDF generation
  documentNumber?: string;
  clientName?: string;
}

const PrintableDocument: React.FC<PrintableDocumentProps> = ({
  title,
  onClose,
  children,
  documentType,
  onDownloadPdf,
  onShare,
  documentNumber,
  clientName
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Use appropriate PDF download hook based on document type
  const invoicePDFHook = useInvoicePDFDownload({
    onSuccess: () => {
      console.log('Invoice PDF downloaded successfully');
    },
    onError: (error) => {
      console.error('Invoice PDF download failed:', error);
    }
  });

  const quotationPDFHook = useQuotationPDFDownload({
    onSuccess: () => {
      console.log('Quotation PDF downloaded successfully');
    },
    onError: (error) => {
      console.error('Quotation PDF download failed:', error);
    }
  });

  const pdfHook = documentType === 'invoice' ? invoicePDFHook : quotationPDFHook;

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: title,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      console.log('Printing completed');
    },
    onPrintError: (error) => {
      setIsPrinting(false);
      console.error('Print error:', error);
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .print-break-before {
          page-break-before: always;
        }
        .print-break-after {
          page-break-after: always;
        }
        .print-break-inside-avoid {
          page-break-inside: avoid;
        }
      }
    `
  });

  const handleDownloadPdf = async () => {
    if (onDownloadPdf) {
      // Use legacy handler if provided
      onDownloadPdf();
      return;
    }

    // Use new PDF generation
    if (!componentRef.current || !documentNumber) {
      console.error('Missing required data for PDF generation');
      return;
    }

    if (documentType === 'invoice') {
      await invoicePDFHook.downloadInvoicePDF(
        componentRef,
        documentNumber,
        clientName
      );
    } else {
      await quotationPDFHook.downloadQuotationPDF(
        componentRef,
        documentNumber,
        clientName
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#f5f0e8] flex justify-between items-center">
          <h2 className="font-medium text-xl text-[#3a3226]">
            {documentType === 'invoice' ? 'Invoice Preview' : 'Quotation Preview'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting || pdfHook.isGenerating}
              className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <Loader2Icon className="h-5 w-5 mr-1 animate-spin" />
              ) : (
                <PrinterIcon className="h-5 w-5 mr-1" />
              )}
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={pdfHook.isGenerating || isPrinting}
              className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfHook.isGenerating ? (
                <Loader2Icon className="h-5 w-5 mr-1 animate-spin" />
              ) : (
                <DownloadIcon className="h-5 w-5 mr-1" />
              )}
              <span>{pdfHook.isGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {onShare && (
              <button
                onClick={onShare}
                disabled={pdfHook.isGenerating || isPrinting}
                className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2Icon className="h-5 w-5 mr-1" />
                <span>Share</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] rounded-lg transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="mx-auto bg-white shadow-md">
            {/* A4 size container */}
            <div
              ref={componentRef}
              className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-lg rounded-lg"
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Progress Indicator */}
      <PDFProgressIndicator
        progress={pdfHook.progress}
        isGenerating={pdfHook.isGenerating}
        error={pdfHook.error}
        onClose={pdfHook.clearError}
        onRetry={() => handleDownloadPdf()}
      />

      {/* Print-only styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .print-break-before {
            page-break-before: always;
          }

          .print-break-after {
            page-break-after: always;
          }

          .print-break-inside-avoid {
            page-break-inside: avoid;
          }

          /* Ensure proper table printing */
          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableDocument;
