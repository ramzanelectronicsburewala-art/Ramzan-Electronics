import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';
import { SEED_USERS } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isDemoUser: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, username: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsDemo: (type: 'creator' | 'explorer' | 'admin') => void;
  refreshProfile: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Check and fetch user profile from Firestore
  const syncProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      const isSiteAdmin =
        firebaseUser.email === 'ramzanelectronicsburewala@gmail.com' ||
        (snap.exists() && snap.data()?.isAdmin === true);

      setIsAdmin(isSiteAdmin);

      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Create initial default profile in Firestore
        const defaultUsername = (firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 6)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_.]/g, '');

        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          username: defaultUsername,
          displayName: firebaseUser.displayName || defaultUsername,
          email: firebaseUser.email || undefined,
          avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          bio: 'Hey there! Exploring Pulse 🌟',
          website: '',
          isVerified: isSiteAdmin,
          isAdmin: isSiteAdmin,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isPrivate: false,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);

        // Also create private info doc
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid, 'private', 'info'), {
            email: firebaseUser.email || '',
            blockedUserIds: [],
            savedPostIds: [],
            allowDirectMessages: 'everyone',
            allowComments: 'everyone',
          });
        } catch (e) {
          console.warn('Private doc write fallback:', e);
        }
      }
    } catch (err) {
      console.warn('Profile sync fallback to local representation:', err);
      // Fallback profile if offline
      setUserProfile({
        userId: firebaseUser.uid,
        username: firebaseUser.email?.split('@')[0] || 'pulse_user',
        displayName: firebaseUser.displayName || 'Pulse User',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Check if there was a saved demo user session in localStorage
    const savedDemo = localStorage.getItem('pulse_demo_session');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUserProfile(parsed);
        setIsDemoUser(true);
        setIsAdmin(parsed.isAdmin || parsed.email === 'ramzanelectronicsburewala@gmail.com');
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('pulse_demo_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setIsDemoUser(false);
        await syncProfile(firebaseUser);
      } else {
        setCurrentUser(null);
        if (!isDemoUser) {
          setUserProfile(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    localStorage.removeItem('pulse_demo_session');
    setIsDemoUser(false);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await syncProfile(res.user);
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string, username: string, displayName: string) => {
    setLoading(true);
    localStorage.removeItem('pulse_demo_session');
    setIsDemoUser(false);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isSiteAdmin = email === 'ramzanelectronicsburewala@gmail.com';
      const newProfile: UserProfile = {
        userId: res.user.uid,
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        email,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'Just joined Pulse! ✨',
        website: '',
        isVerified: isSiteAdmin,
        isAdmin: isSiteAdmin,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', res.user.uid), newProfile);
      setUserProfile(newProfile);
      setIsAdmin(isSiteAdmin);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    localStorage.removeItem('pulse_demo_session');
    setIsDemoUser(false);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await syncProfile(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('pulse_demo_session');
    setIsDemoUser(false);
    setUserProfile(null);
    setIsAdmin(false);
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const loginAsDemo = (type: 'creator' | 'explorer' | 'admin') => {
    let demoProfile: UserProfile;
    if (type === 'admin') {
      demoProfile = { ...SEED_USERS[3] };
    } else if (type === 'creator') {
      demoProfile = { ...SEED_USERS[0] };
    } else {
      demoProfile = {
        userId: 'user-demo-explorer',
        username: 'alex_explorer',
        displayName: 'Alex Rivers',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        bio: 'Explorer, creator & social media tester 🚀',
        website: 'https://pulse.app',
        isVerified: false,
        isAdmin: false,
        followersCount: 120,
        followingCount: 88,
        postsCount: 2,
        createdAt: new Date().toISOString(),
      };
    }

    localStorage.setItem('pulse_demo_session', JSON.stringify(demoProfile));
    setUserProfile(demoProfile);
    setIsDemoUser(true);
    setIsAdmin(demoProfile.isAdmin || false);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await syncProfile(currentUser);
    }
  };

  const updateCurrentProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);

    if (isDemoUser) {
      localStorage.setItem('pulse_demo_session', JSON.stringify(updated));
    } else if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (e) {
        console.error('Failed to update profile in Firestore:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        isDemoUser,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        loginAsDemo,
        refreshProfile,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
