'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './contexts/session-context';
import { Dashboard } from './components/dashboard';

export default function HomePage() {
  const { isAuthenticated, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login/driver');
    }
    if (user?.role === 'admin') {
      router.push('/parking-lots/new');
    }
    if (user?.role === 'driver') {
      router.push('/parking-lots');
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="text-center">
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    </main>
  );
}
