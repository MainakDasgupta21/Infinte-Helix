import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function mapFirebaseUser(fbUser) {
  if (!fbUser) return null;
  return {
    uid: fbUser.uid,
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email,
    photoURL: fbUser.photoURL || null,
    initials: getInitials(fbUser.displayName || fbUser.email?.split('@')[0]),
    emailVerified: fbUser.emailVerified,
    provider: fbUser.providerData?.[0]?.providerId || 'password',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  /** While true, AuthPage should not auto-redirect to dashboard (email sign-up creates a session briefly before we sign out). */
  const [registrationInProgress, setRegistrationInProgress] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(mapFirebaseUser(fbUser));
        try {
          const token = await fbUser.getIdToken();
          await authAPI.syncProfile(token);
        } catch {
          // backend sync is best-effort
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(cred.user);
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    if (!auth) throw new Error('Firebase not configured');
    setRegistrationInProgress(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      try {
        const token = await cred.user.getIdToken();
        await authAPI.register(token, { displayName, email });
      } catch {
        // backend registration is best-effort
      }
      await firebaseSignOut(auth);
      return { registered: true };
    } catch (err) {
      if (auth?.currentUser) {
        await firebaseSignOut(auth).catch(() => {});
      }
      throw err;
    } finally {
      setRegistrationInProgress(false);
    }
  }, []);

  const signInWithGoogleHandler = useCallback(async () => {
    if (!auth || !googleProvider) throw new Error('Firebase/Google not configured');
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(result.user);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!auth) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    registrationInProgress,
    signIn,
    signUp,
    signInWithGoogle: signInWithGoogleHandler,
    signOut: handleSignOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
