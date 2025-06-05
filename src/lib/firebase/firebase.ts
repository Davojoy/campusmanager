
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  // Removed: initializeFirestore, persistentLocalCache, persistentMultipleTabManager
  type Firestore,
  // Removed: type FirestoreError
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

let appInstance: FirebaseApp;
let authInstance: Auth;
let firestoreInstance: Firestore;
let storageInstance: FirebaseStorage;

if (typeof window === 'undefined') {
  // Server-side initialization
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(appInstance);
  firestoreInstance = getFirestore(appInstance); // Server doesn't use client-side offline persistence
  storageInstance = getStorage(appInstance);
  // console.log('Firebase initialized for server/non-browser environment.');
} else {
  // Client-side initialization
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(appInstance);
  storageInstance = getStorage(appInstance);
  
  // Initialize Firestore without persistent cache - relies on network / in-memory cache
  firestoreInstance = getFirestore(appInstance);
  // console.log('Firestore client-side: Initialized with default (in-memory) cache.');
}

export { 
  appInstance as app, 
  authInstance as auth, 
  firestoreInstance as db, 
  storageInstance as storage 
};
