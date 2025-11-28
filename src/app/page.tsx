'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './contexts/session-context';

export default function HomePage() {
  const { isAuthenticated, user, isHydrated } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait until session is hydrated, otherwise we might redirect too early
    if (!isHydrated) return;

    // Not logged in → go to driver login (or a general login page)
    if (!isAuthenticated) {
      router.replace('/login/driver');
      return;
    }

    // Logged in as admin → admin home
    if (user?.role === 'admin') {
      router.replace('/home/admin');
      return;
    }

    // Logged in as driver → driver home / list of parking lots
    if (user?.role === 'driver') {
      router.replace('/parking-lots');
      return;
    }

    // Fallback: if logged in but role is somehow missing
    router.replace('/login/driver');
  }, [isHydrated, isAuthenticated, user?.role, router]);

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