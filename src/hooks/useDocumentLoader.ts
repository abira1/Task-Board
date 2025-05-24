import { useState, useEffect, useCallback, useRef } from 'react';

export interface LoadingState {
  loading: boolean;
  error: string | null;
  data: any | null;
  retry: () => void;
}

interface UseDocumentLoaderOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Custom hook for robust document loading with timeout, retry, and error handling
 */
export const useDocumentLoader = <T>(
  loadFunction: () => Promise<T | null>,
  dependencies: any[] = [],
  options: UseDocumentLoaderOptions = {}
): LoadingState => {
  const {
    timeout = 15000,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Load data function with comprehensive error handling
  const loadData = useCallback(async (attempt = 0) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      
      // Create new abort controller for this request
      cleanup();
      abortControllerRef.current = new AbortController();

      // Set up timeout
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setError(`Loading timeout after ${timeout / 1000} seconds. Please check your connection and try again.`);
          setLoading(false);
          cleanup();
        }
      }, timeout);

      console.log(`Loading data (attempt ${attempt + 1}/${retryAttempts + 1})`);
      
      // Execute the load function
      const result = await loadFunction();
      
      // Clear timeout on successful load
      cleanup();
      
      if (!mountedRef.current) return;

      if (result !== null) {
        console.log('Data loaded successfully:', result);
        setData(result);
        setRetryCount(0);
      } else {
        console.log('No data found');
        setData(null);
      }
      
      setLoading(false);
      
    } catch (err) {
      cleanup();
      
      if (!mountedRef.current) return;
      
      console.error(`Error loading data (attempt ${attempt + 1}):`, err);
      
      // Check if we should retry
      if (attempt < retryAttempts) {
        console.log(`Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          if (mountedRef.current) {
            setRetryCount(attempt + 1);
            loadData(attempt + 1);
          }
        }, retryDelay * Math.pow(2, attempt)); // Exponential backoff
      } else {
        // All retries exhausted
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(`${errorMessage}. Please check your connection and try again.`);
        setLoading(false);
      }
    }
  }, [loadFunction, timeout, retryAttempts, retryDelay, cleanup]);

  // Retry function for manual retries
  const retry = useCallback(() => {
    setRetryCount(0);
    loadData(0);
  }, [loadData]);

  // Effect to load data when dependencies change
  useEffect(() => {
    mountedRef.current = true;
    loadData(0);
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    loading,
    error,
    data,
    retry
  };
};

/**
 * Hook specifically for loading invoices with proper error handling
 */
export const useInvoiceLoader = (
  getInvoice: (id: string) => Promise<any>,
  id: string | undefined
) => {
  return useDocumentLoader(
    async () => {
      if (!id) return null;
      return await getInvoice(id);
    },
    [id, getInvoice],
    {
      timeout: 20000, // 20 seconds for invoice loading
      retryAttempts: 3,
      retryDelay: 1000
    }
  );
};

/**
 * Hook specifically for loading quotations with proper error handling
 */
export const useQuotationLoader = (
  getQuotation: (id: string) => Promise<any>,
  id: string | undefined
) => {
  return useDocumentLoader(
    async () => {
      if (!id) return null;
      return await getQuotation(id);
    },
    [id, getQuotation],
    {
      timeout: 20000, // 20 seconds for quotation loading
      retryAttempts: 3,
      retryDelay: 1000
    }
  );
};
