import { database } from '../firebase/config';
import { ref, set, push, update } from 'firebase/database';

// Define the structure for offline queue items
interface QueueItem {
  id: string;
  operation: 'add' | 'update' | 'remove';
  path: string;
  data: any;
  timestamp: number;
}

// Class to manage offline data operations
class OfflineDataManager {
  private queue: QueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private storageKey: string = 'toiral_offline_queue';

  constructor() {
    // Load any existing queue from localStorage
    this.loadQueue();

    // Set up event listeners for online/offline status
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
  }

  // Handle online/offline status changes
  private handleOnlineStatusChange() {
    const wasOffline = !this.isOnline;
    this.isOnline = navigator.onLine;

    // If we're coming back online, process the queue
    if (this.isOnline && wasOffline) {
      this.processQueue();
    }
  }

  // Load the queue from localStorage
  private loadQueue() {
    const savedQueue = localStorage.getItem(this.storageKey);
    if (savedQueue) {
      try {
        this.queue = JSON.parse(savedQueue);
      } catch (error) {
        console.error('Error parsing offline queue:', error);
        this.queue = [];
      }
    }
  }

  // Save the queue to localStorage
  private saveQueue() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  // Add an item to the queue
  public queueOperation(operation: 'add' | 'update' | 'remove', path: string, data: any) {
    const queueItem: QueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      path,
      data,
      timestamp: Date.now()
    };

    this.queue.push(queueItem);
    this.saveQueue();

    // If we're online, process the queue immediately
    if (this.isOnline) {
      this.processQueue();
    }

    return queueItem.id;
  }

  // Process the queue when online
  public async processQueue() {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const processPromises = this.queue.map(async (item) => {
      try {
        switch (item.operation) {
          case 'add':
            await this.performAdd(item.path, item.data);
            break;
          case 'update':
            await this.performUpdate(item.path, item.data);
            break;
          case 'remove':
            // Not implemented yet
            break;
        }
        return item.id;
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(processPromises);
    
    // Remove successfully processed items from the queue
    const successfulIds = results
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);

    this.queue = this.queue.filter(item => !successfulIds.includes(item.id));
    this.saveQueue();
  }

  // Perform an add operation
  private async performAdd(path: string, data: any) {
    const dataRef = ref(database, path);
    const newRef = push(dataRef);
    await set(newRef, data);
    return newRef.key;
  }

  // Perform an update operation
  private async performUpdate(path: string, data: any) {
    const dataRef = ref(database, `${path}`);
    await update(dataRef, data);
  }

  // Get the current queue length
  public getQueueLength(): number {
    return this.queue.length;
  }

  // Check if there are pending operations
  public hasPendingOperations(): boolean {
    return this.queue.length > 0;
  }
}

// Create a singleton instance
const offlineDataManager = new OfflineDataManager();

export default offlineDataManager;
