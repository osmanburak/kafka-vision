'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { disconnectSocket } from '@/lib/socket';

interface User {
  uid: string;
  displayName: string;
  mail: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pendingApproval: boolean;
  pendingMessage: string | null;
  authEnabled: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkApprovalStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [authEnabled, setAuthEnabled] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      // Track whether auth is enabled
      setAuthEnabled(data.authEnabled !== false);
      
      if (data.authenticated || !data.authEnabled) {
        // Set user whether authenticated normally or auth is disabled
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    if (data.pendingApproval) {
      setPendingApproval(true);
      setPendingMessage(data.message);
      setUser(null);
      return;
    }
    
    if (data.rejected) {
      throw new Error(data.message || 'Access denied');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }
    
    setUser(data.user);
    setPendingApproval(false);
    setPendingMessage(null);
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      disconnectSocket();
      setUser(null);
      setPendingApproval(false);
      setPendingMessage(null);
    }
  };

  const checkApprovalStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-approval`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.status === 'approved' && data.success) {
        // User has been approved and logged in!
        setUser(data.user);
        setPendingApproval(false);
        setPendingMessage(null);
        
        // Reload page to reinitialize with full authentication
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else if (data.status === 'rejected') {
        // User was rejected
        setPendingApproval(false);
        setPendingMessage(data.message);
        setUser(null);
      } else if (data.status === 'pending') {
        // Still pending, update message
        setPendingMessage(data.message);
      } else {
        // Session lost or other error
        setPendingApproval(false);
        setPendingMessage(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      // Don't change state on error, let user try again
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, pendingApproval, pendingMessage, authEnabled, login, logout, checkAuth, checkApprovalStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}