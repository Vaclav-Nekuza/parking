"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SetupAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupAccount = async () => {
      if (status === "loading") return;
      
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        // Get the selected role from localStorage
        const selectedRole = localStorage.getItem("selectedRole");
        
        if (!selectedRole || (selectedRole !== "driver" && selectedRole !== "admin")) {
          setError("No role selected. Please try logging in again.");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // Create the account with the selected role
        const response = await fetch("/api/auth/create-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            role: selectedRole,
            email: session.user?.email,
            name: session.user?.name,
            image: session.user?.image,
          }),
        });

        if (response.ok) {
          // Clear the selected role from localStorage
          localStorage.removeItem("selectedRole");
          
          // Redirect to home page
          router.push("/");
        } else {
          const data = await response.json();
          setError(data.error || "Failed to create account");
        }
      } catch (error) {
        console.error("Error setting up account:", error);
        setError("An error occurred while setting up your account");
      } finally {
        setIsLoading(false);
      }
    };

    setupAccount();
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Setting up your account...</h2>
          <p className="mt-2 text-gray-600">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Setup Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}