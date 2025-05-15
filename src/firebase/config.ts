// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeiI4iRtnUzhjCAYcAgVNWIspfpwbjOPQ",
  authDomain: "toiral-taskboard.firebaseapp.com",
  databaseURL: "https://toiral-taskboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "toiral-taskboard",
  storageBucket: "toiral-taskboard.firebasestorage.app",
  messagingSenderId: "878220954929",
  appId: "1:878220954929:web:0276e1faad822667e67410",
  measurementId: "G-W7WX1NPDD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database, analytics };
