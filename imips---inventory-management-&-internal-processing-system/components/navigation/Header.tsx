
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC<{ setSidebarOpen: (open: boolean) => void }> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
      <button
        onClick={() => setSidebarOpen(true)}
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          {/* Search bar can be added here */}
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <div className="ml-3 relative" ref={dropdownRef}>
            <div>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="max-w-xs bg-white dark:bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" id="user-menu" aria-haspopup="true">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
            {dropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                </div>
                <a href="#/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">Settings</a>
                <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
