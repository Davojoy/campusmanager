
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  type Auth, 
  GoogleAuthProvider // Import GoogleAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  type FirestoreError,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider; // Declare googleProvider

if (typeof window === 'undefined') {
  // Server-side initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app); // Server doesn't use client-side offline persistence
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  // console.log('Firebase initialized for server/non-browser environment.');
} else {
  // Client-side initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider(); // Initialize for client

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    // console.log('Firestore client-side: Initialized with persistent cache.');
  } catch (error) {
    const typedError = error as FirestoreError;
    if (typedError.code === 'failed-precondition') {
      console.warn(
        'Firestore: Multiple tabs open, persistence can only be enabled in one tab at a time.'
      );
      // Fallback to default (in-memory) cache if persistent cache fails
      db = getFirestore(app);
      // console.log('Firestore client-side: Initialized with default (in-memory) cache due to failed precondition.');
    } else if (typedError.code === 'unimplemented') {
      console.warn(
        'Firestore: The current browser does not support all of the features required to enable persistence.'
      );
      db = getFirestore(app);
      // console.log('Firestore client-side: Initialized with default (in-memory) cache due to unimplemented feature.');
    } else {
      console.error("Error initializing Firestore with persistence:", typedError);
      db = getFirestore(app); // Fallback
    }
  }
}

export { app, auth, db, storage, googleProvider }; // Export googleProvider
