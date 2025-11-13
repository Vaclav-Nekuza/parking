'use client';

import { useSession } from '../contexts/session-context';
import { useRouter } from 'next/navigation';

export function Dashboard() {
  const { user, logout } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
            Access
            <br />
            Denied
          </h1>
          <p className="text-gray-500 mb-8">
            Please log in to access the dashboard.
          </p>
          <button
            onClick={() => router.push('/login/driver')}
            className="rounded-2xl px-8 py-3 bg-blue-400 text-white font-medium hover:opacity-90"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
              Dashboard
            </h1>
            <p className="text-gray-500">
              Welcome back, {user.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl px-6 py-3 border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-medium text-sm"
          >
            Logout
          </button>
        </div>

        {/* Role Badge */}
        <div className="mb-8">
          <div className="bg-white border rounded-2xl px-4 py-3">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Current Role
            </div>
            <div className="text-lg font-semibold capitalize text-black">
              {user.role}
            </div>
          </div>
        </div>

        {/* Role-specific content */}
        {user.role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-400 mb-4">
              Admin Dashboard
            </h2>
            
            <div className="grid gap-4">
              <button 
                onClick={() => router.push('/form')}
                className="w-full rounded-2xl px-6 py-4 bg-blue-400 text-white font-medium hover:opacity-90 text-left"
              >
                <div className="text-lg font-semibold">Add Parking Area</div>
                <div className="text-blue-100 text-sm">Create new parking lots</div>
              </button>
              
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Manage Parking Lots
                </div>
                <div className="text-gray-500 text-sm">
                  View and edit existing parking areas (Coming soon)
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  User Management
                </div>
                <div className="text-gray-500 text-sm">
                  Manage drivers and admins (Coming soon)
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === 'driver' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-400 mb-4">
              Driver Dashboard
            </h2>
            
            <div className="grid gap-4">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Find Parking
                </div>
                <div className="text-gray-500 text-sm">
                  Search for available parking spots (Coming soon)
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  My Reservations
                </div>
                <div className="text-gray-500 text-sm">
                  View your current and past bookings (Coming soon)
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Payment History
                </div>
                <div className="text-gray-500 text-sm">
                  Track your parking expenses (Coming soon)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}