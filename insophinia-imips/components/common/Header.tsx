

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import ProfileModal from './ProfileModal';
import NotificationBell from './NotificationBell';
import AuthenticatedImage from './AuthenticatedImage';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="bg-white shadow-md p-4 flex items-center z-10 relative">
        {/* Hamburger Menu Icon - visible only on smaller screens */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-200 lg:hidden"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Live Clock - hidden on small screens */}
        <div className="hidden lg:block ml-4">
            <p className="font-semibold text-gray-700">{currentDateTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-sm text-gray-500">{currentDateTime.toLocaleTimeString()}</p>
        </div>
        
        {/* Right-aligned content */}
        <div className="flex items-center space-x-4 sm:space-x-6 ml-auto">
            <NotificationBell />
            <div className="flex items-center cursor-pointer" onClick={() => setProfileModalOpen(true)}>
              <AuthenticatedImage src={user?.profilePictureUrl} alt={user?.name || 'User Profile'} className="h-10 w-10 rounded-full mr-3 object-cover border-2 border-gray-200" />
              <div>
                <p className="font-semibold text-gray-800 hidden sm:block">{user?.name}</p>
                <p className="text-sm text-gray-500 hidden sm:block">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-600" />
            </button>
        </div>
      </header>
      {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} />}
    </>
  );
};

export default Header;