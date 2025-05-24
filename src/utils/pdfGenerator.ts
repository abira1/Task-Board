import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
  filename?: string;
  quality?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
}

export interface PDFGenerationProgress {
  stage: 'preparing' | 'capturing' | 'generating' | 'downloading' | 'complete' | 'error';
  progress: number;
  message: string;
}

/**
 * Generate PDF from HTML element with comprehensive error handling and progress tracking
 */
export const generatePDF = async (
  element: HTMLElement,
  options: PDFGenerationOptions = {},
  onProgress?: (progress: PDFGenerationProgress) => void
): Promise<void> => {
  const {
    filename = 'document.pdf',
    quality = 1.0,
    format = 'a4',
    orientation = 'portrait',
    margin = 10,
    scale = 2
  } = options;

  try {
    // Stage 1: Preparing
    onProgress?.({
      stage: 'preparing',
      progress: 10,
      message: 'Preparing document for PDF generation...'
    });

    // Ensure element is visible and properly rendered
    const originalDisplay = element.style.display;
    const originalVisibility = element.style.visibility;
    element.style.display = 'block';
    element.style.visibility = 'visible';

    // Wait for any images or fonts to load
    await waitForElementToLoad(element);

    // Stage 2: Capturing
    onProgress?.({
      stage: 'capturing',
      progress: 30,
      message: 'Capturing document content...'
    });

    // Configure html2canvas options for high quality
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure all styles are properly applied in the cloned document
        const clonedElement = clonedDoc.querySelector('[data-pdf-content]') || 
                             clonedDoc.body.firstElementChild;
        if (clonedElement) {
          (clonedElement as HTMLElement).style.transform = 'none';
          (clonedElement as HTMLElement).style.margin = '0';
          (clonedElement as HTMLElement).style.padding = '0';
        }
      }
    });

    // Restore original styles
    element.style.display = originalDisplay;
    element.style.visibility = originalVisibility;

    // Stage 3: Generating PDF
    onProgress?.({
      stage: 'generating',
      progress: 60,
      message: 'Generating PDF document...'
    });

    // Calculate PDF dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // A4: 210mm, Letter: 216mm
    const imgHeight = format === 'a4' ? 297 : 279; // A4: 297mm, Letter: 279mm
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scaling to fit page with margins
    const availableWidth = imgWidth - (margin * 2);
    const availableHeight = imgHeight - (margin * 2);
    
    const widthRatio = availableWidth / (canvasWidth * 0.264583); // Convert px to mm
    const heightRatio = availableHeight / (canvasHeight * 0.264583);
    const ratio = Math.min(widthRatio, heightRatio);
    
    const scaledWidth = (canvasWidth * 0.264583) * ratio;
    const scaledHeight = (canvasHeight * 0.264583) * ratio;

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality);
    
    // Calculate position to center the content
    const xPosition = (imgWidth - scaledWidth) / 2;
    const yPosition = margin;

    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', xPosition, yPosition, scaledWidth, scaledHeight);

    // Stage 4: Downloading
    onProgress?.({
      stage: 'downloading',
      progress: 90,
      message: 'Preparing download...'
    });

    // Generate filename with timestamp if not provided
    const finalFilename = filename.includes('.pdf') ? filename : `${filename}.pdf`;
    
    // Download the PDF
    pdf.save(finalFilename);

    // Stage 5: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'PDF downloaded successfully!'
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Failed to generate PDF'
    });
    throw error;
  }
};

/**
 * Wait for all images and fonts in an element to load
 */
const waitForElementToLoad = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      // Timeout after 5 seconds
      setTimeout(resolve, 5000);
    });
  });

  // Wait for fonts to load
  if (document.fonts) {
    await document.fonts.ready;
  }

  // Wait for all images
  await Promise.all(imagePromises);
  
  // Additional delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 500));
};

/**
 * Generate filename for invoice/quotation PDFs
 */
export const generateDocumentFilename = (
  type: 'invoice' | 'quotation',
  documentNumber: string,
  clientName?: string
): string => {
  const sanitizedClientName = clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `${type.charAt(0).toUpperCase() + type.slice(1)}_${documentNumber}_${sanitizedClientName}_${timestamp}.pdf`;
};

/**
 * Prepare element for PDF generation by adding necessary attributes and styles
 */
export const prepareElementForPDF = (element: HTMLElement): void => {
  element.setAttribute('data-pdf-content', 'true');
  
  // Ensure proper styling for PDF generation
  const style = element.style;
  style.backgroundColor = '#ffffff';
  style.color = '#000000';
  style.fontFamily = 'Arial, sans-serif';
  style.fontSize = '12px';
  style.lineHeight = '1.4';
  
  // Ensure all child elements are visible
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style.display === 'none') {
      htmlEl.style.display = 'block';
    }
  });
};

/**
 * Validate PDF generation requirements
 */
export const validatePDFRequirements = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if required APIs are available
  if (typeof window === 'undefined') {
    errors.push('PDF generation requires a browser environment');
  }
  
  if (!window.HTMLCanvasElement) {
    errors.push('Canvas API is not supported in this browser');
  }
  
  if (!window.Blob) {
    errors.push('Blob API is not supported in this browser');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
