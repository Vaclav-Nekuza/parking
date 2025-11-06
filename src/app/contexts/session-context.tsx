'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, SessionContextType } from '@/lib/types';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // Load session from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('parking-session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setUser(sessionData);
      } catch (error) {
        console.error('Error parsing saved session:', error);
        // Clear invalid session data
        localStorage.removeItem('parking-session');
      }
    }
  }, []);

  const login = (role: UserRole) => {
    // Create a simple session with the selected role
    // In a real application, this would involve API calls and proper authentication
    const newUser: User = {
      id: `${role}-${Date.now()}`, // Simple ID generation for demo
      role,
      name: role === 'driver' ? 'Demo Driver' : 'Demo Admin',
      email: role === 'driver' ? 'driver@example.com' : 'admin@example.com'
    };

    setUser(newUser);
    
    // Save session to localStorage
    localStorage.setItem('parking-session', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('parking-session');
  };

  const isAuthenticated = user !== null;

  const value: SessionContextType = {
    user,
    login,
    logout,
    isAuthenticated
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}