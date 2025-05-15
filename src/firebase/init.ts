import { initializeDatabase } from './database';
import { defaultData } from './initData';

// Initialize Firebase database with default data
export const initFirebaseData = async () => {
  try {
    await initializeDatabase(defaultData);
    console.log('Firebase database initialized with default data');
  } catch (error) {
    console.error('Error initializing Firebase database:', error);
  }
};
