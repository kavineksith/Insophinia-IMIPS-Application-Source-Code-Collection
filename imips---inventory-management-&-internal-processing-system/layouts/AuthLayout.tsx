
import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900 dark:text-white">IMIPS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600 dark:text-gray-300">
            Sign in to your account
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
