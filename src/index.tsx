import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { initFirebaseData } from './firebase/init';
import { initPWA } from './pwa/registerSW';
import offlineDataManager from './utils/offlineDataManager';

// Initialize PWA features
initPWA();

// Initialize Firebase database with default data
initFirebaseData().then(() => {
  console.log('Firebase initialized successfully');
}).catch(error => {
  console.error('Firebase initialization error:', error);
});

// Process any pending offline operations when the app starts
if (navigator.onLine && offlineDataManager.hasPendingOperations()) {
  offlineDataManager.processQueue().then(() => {
    console.log('Processed offline operations queue');
  }).catch(error => {
    console.error('Error processing offline operations:', error);
  });
}

render(<App />, document.getElementById("root"));