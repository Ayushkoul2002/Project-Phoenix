// ============================================
// PROJECT PHOENIX — Firebase Configuration
// ============================================
// Replace the placeholder values below with
// your actual Firebase project credentials.
// Find them at: Firebase Console → Project Settings → General → Your Apps
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Auto-detect if placeholders are active
export const useMock = !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === "YOUR_API_KEY" || 
  firebaseConfig.apiKey.startsWith("YOUR_");

let app = null;
let auth = null;
let db = null;

if (!useMock) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase init failed, falling back to mock mode:", error);
  }
}

export { app, auth, db };
export default app;
