'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../contexts/session-context';
import { UserRole } from '@/lib/types';

interface WithAuthOptions {
  requiredRole: UserRole;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions
) {
  const { requiredRole } = options;

  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user } = useSession();
    const router = useRouter();

    useEffect(() => {
        console.log(isAuthenticated, user);
      if (!isAuthenticated) {
        // Redirect to appropriate login based on required role
        const loginPath = requiredRole === 'admin' ? '/login/admin' : '/login/driver';
        router.push(loginPath);
        return;
      }

      // If user is authenticated but doesn't have the required role
      if (user && user.role !== requiredRole) {
        // Redirect based on their actual role
        const redirectPath = user.role === 'admin' ? '/parking-lots/new' : '/parking-lots';
        router.push(redirectPath);
        return;
      }
    }, [isAuthenticated, user, router]);

    // Show loading state while checking authentication
    if (!isAuthenticated || (user && user.role !== requiredRole)) {
      return (
        <main className="min-h-screen bg-white">
          <div className="max-w-xl mx-auto px-6 py-10">
            <div className="text-center">
              <p className="text-gray-500">Redirecting...ZZZ</p>
            </div>
          </div>
        </main>
      );
    }

    // Render the wrapped component if authenticated and has correct role
    return <WrappedComponent {...props} />;
  };
}