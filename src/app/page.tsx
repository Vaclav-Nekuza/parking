import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            ParkingApp
          </h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
