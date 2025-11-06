'use client';

import { SessionProvider as NextSessionProvider} from 'next-auth/react';
import {SessionProvider} from "./session-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextSessionProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </NextSessionProvider>
  );
}