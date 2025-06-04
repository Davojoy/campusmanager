"use client";

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useEffect, useState, useContext } from 'react';
import { auth, db } from '@/lib/firebase/firebase';
import type { UserProfile, UserRole } from '@/types';
import { LoadingScreen } from '@/components/global/loading-screen';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticating: boolean;
  logout: () => Promise<void>;
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // For initial auth check
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      setUserProfile(userDocSnap.data() as UserProfile);
    } else {
      // This case might happen if user doc creation failed during signup
      // Or if it's a new signup flow part
      console.warn("User profile not found in Firestore for UID:", user.uid);
      // Potentially create a default profile or handle as an error
      // For now, set role to null to force profile completion or logout
      const defaultProfile: UserProfile = { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName || user.email?.split('@')[0] || 'New User', 
        role: null 
      };
      await setDoc(userDocRef, defaultProfile); // Create a basic profile
      setUserProfile(defaultProfile);
    }
  };
  
  const refetchUserProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticating) { // Only redirect after initial auth check
      const publicPaths = ['/login', '/signup'];
      const isPublicPath = publicPaths.includes(pathname);

      if (!currentUser && !isPublicPath) {
        router.push('/login');
      } else if (currentUser && isPublicPath) {
        router.push('/dashboard');
      } else if (currentUser && userProfile?.role === null && pathname !== '/complete-profile') {
        // Optional: redirect to a profile completion page if role is null
        // router.push('/complete-profile');
      }
    }
  }, [currentUser, userProfile, isAuthenticating, pathname, router]);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading || isAuthenticating) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, isAuthenticating, logout, refetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
