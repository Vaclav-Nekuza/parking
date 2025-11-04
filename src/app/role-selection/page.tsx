"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function RoleSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<"driver" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role: "driver" | "admin") => {
    setIsLoading(true);
    try {
      // Call API to convert the user account to the selected role
      const response = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Failed to set role");
      }
    } catch (error) {
      console.error("Error setting role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Account Type
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select how you want to use Parking Manager
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Driver Option */}
          <button
            onClick={() => handleRoleSelection("driver")}
            disabled={isLoading}
            className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-medium text-gray-900">Driver</h3>
              <p className="text-sm text-gray-500">
                Find and reserve parking spots for your vehicles
              </p>
              <ul className="mt-2 text-xs text-gray-400">
                <li>• Search available parking spots</li>
                <li>• Make reservations</li>
                <li>• Manage your vehicles</li>
              </ul>
            </div>
            {isLoading && (
              <div className="absolute right-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              </div>
            )}
          </button>

          {/* Admin Option */}
          <button
            onClick={() => handleRoleSelection("admin")}
            disabled={isLoading}
            className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-medium text-gray-900">Admin</h3>
              <p className="text-sm text-gray-500">
                Manage parking lots and monitor operations
              </p>
              <ul className="mt-2 text-xs text-gray-400">
                <li>• Manage parking houses</li>
                <li>• Monitor reservations</li>
                <li>• Set pricing and availability</li>
              </ul>
            </div>
            {isLoading && (
              <div className="absolute right-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
              </div>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            You can change your account type later in settings
          </p>
        </div>
      </div>
    </div>
  );
}