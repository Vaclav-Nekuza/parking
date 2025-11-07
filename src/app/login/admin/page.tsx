'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../contexts/session-context';

export default function AdminLoginPage() {
  const { login, isAuthenticated, isOAuthAuthenticated, nextAuthSession, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    try {
      await login('admin');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-6 py-10">
          <div className="text-center">
            <p className="text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  // If OAuth is authenticated, show loading state while setting up session
  if (isOAuthAuthenticated && nextAuthSession && isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
            ParkingApp
          </h1>
          <div className="mt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
            <h2 className="text-xl font-medium text-black mb-2">
              Setting up your account...
            </h2>
            <p className="text-gray-500">
              Please wait while we prepare your dashboard.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
          Admin
          <br />
          Login
        </h1>
        <p className="text-gray-500 mb-8">
          Sign in with Google to access the admin dashboard
        </p>
        
        <div className="space-y-6">
          <button
            className="w-full flex items-center justify-center rounded-2xl px-8 py-3 bg-gray-100 text-black font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLogin}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Sign in as Admin with Google'}
          </button>
          
          <div className="text-center pt-2">
            <p className="text-gray-500 text-sm">
              Need driver access?{' '}
              <button
                className="text-blue-400 hover:text-blue-500 underline"
                onClick={() => router.push('/login/driver')}
              >
                Login as Driver
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}