'use client';

export function LoginForm() {
    return (
                <div className="space-y-4">
          <button
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={() => {
              // TODO: Implement driver login logic
              console.log('Login as driver clicked');
            }}
          >
            Login as Driver
          </button>
          
          <button
            className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={() => {
              // TODO: Implement admin login logic
              console.log('Login as admin clicked');
            }}
          >
            Login as Admin
          </button>
        </div>
    )
}