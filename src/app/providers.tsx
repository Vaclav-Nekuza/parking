'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from './contexts/session-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </NextAuthSessionProvider>
  );
}