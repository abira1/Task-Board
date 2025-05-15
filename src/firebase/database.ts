import { ref, set, push, onValue, update, remove, get, child, DatabaseReference } from 'firebase/database';
import { database } from './config';

// Generic function to fetch data from a specific path
export const fetchData = <T>(path: string, callback: (data: T | null) => void) => {
  const dataRef = ref(database, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
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
  });
  
  return unsubscribe;
};

// Generic function to add data to a specific path
export const addData = async <T extends object>(path: string, data: T) => {
  const dataRef = ref(database, path);
  const newRef = push(dataRef);
  await set(newRef, data);
  return newRef.key;
};

// Generic function to update data at a specific path
export const updateData = async <T extends object>(path: string, id: string, data: Partial<T>) => {
  const dataRef = ref(database, `${path}/${id}`);
  await update(dataRef, data);
};

// Generic function to remove data at a specific path
export const removeData = async (path: string, id: string) => {
  const dataRef = ref(database, `${path}/${id}`);
  await remove(dataRef);
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
