'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './contexts/session-context';
import { Dashboard } from './components/dashboard';

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login/driver');
    }
  }, [isAuthenticated, router]);

  return (
    <Dashboard />
  );
}
