import { ref, set, push, onValue, update, remove, get, child, DatabaseReference } from 'firebase/database';
import { database } from './config';
import offlineDataManager from '../utils/offlineDataManager';

// Generic function to fetch data from a specific path
export const fetchData = <T>(
  path: string,
  callback: (data: T | null) => void,
  errorCallback?: (error: Error) => void
) => {
  try {
    const dataRef = ref(database, path);
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert Firebase object to array with IDs
            if (typeof data === 'object' && data !== null) {
              const dataWithIds = Object.entries(data).map(([id, value]) => ({
                id,
                ...value as object,
              })) as unknown as T;
              callback(dataWithIds);
            } else {
              callback(data as T);
            }
          } else {
            callback(null);
          }
        } catch (error) {
          console.error(`Error processing data from ${path}:`, error);
          if (errorCallback && error instanceof Error) {
            errorCallback(error);
          }
        }
      },
      (error) => {
        console.error(`Firebase error for ${path}:`, error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(`Error unsubscribing from ${path}:`, error);
      }
    };
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    if (errorCallback && error instanceof Error) {
      errorCallback(error);
    }
    // Return a no-op function as fallback
    return () => {};
  }
};

// Generic function to add data to a specific path
export const addData = async <T extends object>(path: string, data: T) => {
  try {
    // Try to add data directly to Firebase
    const dataRef = ref(database, path);
    const newRef = push(dataRef);
    await set(newRef, data);
    return newRef.key;
  } catch (error) {
    // If offline or error occurs, queue the operation
    if (!navigator.onLine) {
      console.log('Device is offline. Queueing add operation for later.');
      offlineDataManager.queueOperation('add', path, data);
      return 'pending-' + Date.now(); // Return a temporary ID
    }
    throw error; // Re-throw if it's not an offline issue
  }
};

// Generic function to update data at a specific path
export const updateData = async <T extends object>(path: string, id: string, data: Partial<T>) => {
  try {
    // Try to update data directly in Firebase
    const dataRef = ref(database, `${path}/${id}`);
    await update(dataRef, data);
  } catch (error) {
    // If offline or error occurs, queue the operation
    if (!navigator.onLine) {
      console.log('Device is offline. Queueing update operation for later.');
      offlineDataManager.queueOperation('update', `${path}/${id}`, data);
    } else {
      throw error; // Re-throw if it's not an offline issue
    }
  }
};

// Generic function to remove data at a specific path
export const removeData = async (path: string, id: string) => {
  try {
    // Try to remove data directly from Firebase
    const dataRef = ref(database, `${path}/${id}`);
    await remove(dataRef);
  } catch (error) {
    // If offline or error occurs, queue the operation
    if (!navigator.onLine) {
      console.log('Device is offline. Queueing remove operation for later.');
      offlineDataManager.queueOperation('remove', `${path}/${id}`, null);
    } else {
      throw error; // Re-throw if it's not an offline issue
    }
  }
};

// Enable or disable network connectivity for Firebase
export const setNetworkEnabled = async (enabled: boolean) => {
  try {
    if (enabled) {
      // Note: enableNetwork is not available in this Firebase version
      // We'll just process the queue when coming back online
      console.log('Firebase network connection enabled');

      // Process any pending operations
      if (offlineDataManager.hasPendingOperations()) {
        await offlineDataManager.processQueue();
      }
    } else {
      // Note: disableNetwork is not available in this Firebase version
      console.log('Firebase network connection disabled');
    }
  } catch (error) {
    console.error(`Error ${enabled ? 'enabling' : 'disabling'} network:`, error);
  }
};

// Generic function to get data once from a specific path
export const getDataOnce = async <T>(path: string): Promise<T | null> => {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, path));

  if (snapshot.exists()) {
    return snapshot.val() as T;
  } else {
    return null;
  }
};

// Initialize database with default data if empty
export const initializeDatabase = async (defaultData: Record<string, any>) => {
  const dbRef = ref(database);
  const snapshot = await get(dbRef);

  if (!snapshot.exists()) {
    await set(dbRef, defaultData);
  }
};
