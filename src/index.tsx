import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { initFirebaseData } from './firebase/init';

// Initialize Firebase database with default data
initFirebaseData().then(() => {
  console.log('Firebase initialized successfully');
}).catch(error => {
  console.error('Firebase initialization error:', error);
});

render(<App />, document.getElementById("root"));