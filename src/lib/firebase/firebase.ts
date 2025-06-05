import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  type FirestoreError,
  // CACHE_SIZE_UNLIMITED // Import if you want to set cache size explicitly
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

// This flag ensures client-side initialization logic runs only once.
let clientFirebaseInitialized = false;

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

  if (!clientFirebaseInitialized) {
    try {
      // Initialize Firestore with persistent cache settings.
      // This must be called before any other Firestore operations on the client.
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
          // Example: To set a specific cache size (e.g., 100MB):
          // cacheSizeBytes: 100 * 1024 * 1024,
          // Or for unlimited (default is 40MB for web):
          // cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
        // You can add other Firestore settings here if needed
      });
      // console.log('Firestore client-side: Persistent cache enabled.');
    } catch (error) {
      const firestoreError = error as FirestoreError;
      if (firestoreError.code === 'failed-precondition') {
        // This error means persistence is already enabled in another tab or couldn't be enabled
        // (e.g., multiple tabs trying to initialize simultaneously).
        // Firestore will fall back to in-memory cache for this tab.
        console.warn(
          'Firestore client-side: Persistent cache setup failed (failed-precondition). This can happen if multiple tabs are open or due to other reasons. Firestore will use in-memory cache for this tab.'
        );
        firestoreInstance = getFirestore(appInstance); // Fallback to default in-memory cache
      } else if (firestoreError.code === 'unimplemented') {
        // The browser does not support IndexedDB or other features required for persistence.
        console.warn(
          'Firestore client-side: Persistent cache setup failed (unimplemented). The browser does not support the necessary features. Firestore will use in-memory cache.'
        );
        firestoreInstance = getFirestore(appInstance); // Fallback to default in-memory cache
      } else {
        // Other errors during persistence setup.
        console.error('Firestore client-side: Error initializing with persistent cache:', firestoreError);
        firestoreInstance = getFirestore(appInstance); // Fallback to default in-memory cache
      }
    }
    clientFirebaseInitialized = true;
  } else {
    // If clientFirebaseInitialized is true, firestoreInstance should already be set.
    // However, as a safeguard, if it's somehow not set, initialize it.
    if (!firestoreInstance) {
      firestoreInstance = getFirestore(appInstance);
      // console.log('Firestore client-side: Re-accessed Firestore instance (expected to be already initialized).');
    }
  }
}

// Export with the standard names
export { 
  appInstance as app, 
  authInstance as auth, 
  firestoreInstance as db, 
  storageInstance as storage 
};