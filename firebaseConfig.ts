import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, Messaging } from 'firebase/messaging';
import { getFunctions, Functions } from 'firebase/functions';

const firebaseConfig = {
apiKey: "AIzaSyCFi4LIpQBzs9QGnn4QQdNJtCvMOi_-VF8",
authDomain: "spoilme-edee0.firebaseapp.com",
projectId: "spoilme-edee0",
storageBucket: "spoilme-edee0.appspot.com",
messagingSenderId: "744288044885",
appId: "1:744288044885:web:24614b67ffe485446151dc",
measurementId: "G-H9VG45QVZR"
};

// Check if we are using valid config
// We check if the apiKey is present and not a placeholder
const isConfigured =
firebaseConfig.apiKey &&
firebaseConfig.projectId &&
firebaseConfig.projectId !== "your-app-id";

let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;
let functions: Functions | null = null;
let app: FirebaseApp | null = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    // Initialize Firestore with the specific database ID 'spoilme'
    db = getFirestore(app, "spoilme");

    try {
      storage = getStorage(app);
      console.log("Firebase Storage initialized");
    } catch (storageError) {
      console.error("Firebase Storage init failed:", storageError);
    }

    try {
      auth = getAuth(app);
      console.log('Firebase Auth initialized');
    } catch (authError) {
      console.error('Firebase Auth init failed:', authError);
    }

    try {
      messaging = getMessaging(app);
      console.log('Firebase Messaging initialized');
    } catch (messagingError) {
      console.error('Firebase Messaging init failed:', messagingError);
    }

    try {
      functions = getFunctions(app);
      console.log('Firebase Functions initialized');
    } catch (functionsError) {
      console.error('Firebase Functions init failed:', functionsError);
    }

    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase keys missing or invalid. Application running in Demo Mode (Local Storage).");
}

export { db, storage, auth, app, messaging, functions };
