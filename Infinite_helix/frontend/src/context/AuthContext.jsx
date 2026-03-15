// AuthContext — Firebase authentication state
//
// Provides:
//   - user: current Firebase user object
//   - loading: auth state loading
//   - signIn(): Firebase Google sign-in
//   - signOut(): Firebase sign-out

import React, { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO: Firebase onAuthStateChanged listener
  // TODO: Google sign-in flow
  const value = {};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
