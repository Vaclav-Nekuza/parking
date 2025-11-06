'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession as useNextAuthSession, signIn, signOut } from 'next-auth/react';
import { User, UserRole, SessionContextType } from '@/lib/types';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: nextAuthSession, status } = useNextAuthSession();
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  // Load session from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('parking-session');
    const savedToken = localStorage.getItem('parking-session-token');
    const savedPendingRole = localStorage.getItem('parking-pending-role');
    
    if (savedSession && savedToken) {
      try {
        const sessionData = JSON.parse(savedSession);
        setUser(sessionData);
        setSessionToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved session:', error);
        // Clear invalid session data
        localStorage.removeItem('parking-session');
        localStorage.removeItem('parking-session-token');
      }
    }
    
    if (savedPendingRole) {
      setPendingRole(savedPendingRole as UserRole);
    }
  }, []);

  const login = async (role: UserRole) => {
    try {
      // Store the intended role
      setPendingRole(role);
      localStorage.setItem('parking-pending-role', role);

      // If not OAuth authenticated, sign in with Google first
      if (!nextAuthSession) {
        await signIn('google', { redirect: false });
        return; // Wait for OAuth callback, then createRoleBasedSession will be called
      }

      // If already OAuth authenticated, create role-based session immediately
      await createRoleBasedSession(role);

    } catch (error) {
      console.error('Login error:', error);
      // Clear pending role on error
      setPendingRole(null);
      localStorage.removeItem('parking-pending-role');
    }
  };

  const createRoleBasedSession = async (role: UserRole) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      
      const newUser: User = {
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
      };

      setUser(newUser);
      setSessionToken(data.sessionToken);
      
      // Save session to localStorage
      localStorage.setItem('parking-session', JSON.stringify(newUser));
      localStorage.setItem('parking-session-token', data.sessionToken);

      // Clear pending role
      setPendingRole(null);
      localStorage.removeItem('parking-pending-role');

    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Deactivate session in database
      if (sessionToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        });
      }

      // Sign out from NextAuth
      await signOut({ redirect: false });

      // Clear local state
      setUser(null);
      setSessionToken(null);
      setPendingRole(null);
      localStorage.removeItem('parking-session');
      localStorage.removeItem('parking-session-token');
      localStorage.removeItem('parking-pending-role');

    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle OAuth sign-in completion
  useEffect(() => {
    if (nextAuthSession && !user && status === 'authenticated' && pendingRole) {
      // OAuth is complete and we have a pending role, create the session
      createRoleBasedSession(pendingRole).catch(error => {
        console.error('Failed to create session after OAuth:', error);
      });
    }
  }, [nextAuthSession, user, status, pendingRole]);

  const isAuthenticated = user !== null;

  const value: SessionContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    nextAuthSession,
    isOAuthAuthenticated: !!nextAuthSession,
    isLoading: !!pendingRole && !!nextAuthSession && !user,
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