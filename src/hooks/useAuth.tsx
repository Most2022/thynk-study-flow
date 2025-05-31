
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  session: null;
  user: null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    // No authentication system connected
  };

  const value = {
    session: null,
    user: null,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
