import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: 'demo-user-001',
  displayName: 'Ananya Sharma',
  email: 'ananya.sharma@company.com',
  photoURL: null,
  initials: 'AS',
};

export function AuthProvider({ children }) {
  const [user] = useState(DEMO_USER);
  const [loading] = useState(false);

  const value = { user, loading, signIn: () => {}, signOut: () => {} };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
