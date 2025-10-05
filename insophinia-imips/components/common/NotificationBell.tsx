
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../hooks/useData';
import { BellIcon } from '@heroicons/react/24/solid';

const NotificationBell: React.FC = () => {
  const { notifications, markNotificationsAsRead } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen && unreadCount > 0) {
        // Mark as read when opening, after a short delay
        setTimeout(() => markNotificationsAsRead(), 2000);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle} className="relative p-2 rounded-full hover:bg-gray-200 transition-colors">
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-status-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
            </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 border">
            <div className="p-3 font-semibold border-b text-gray-800">Notifications</div>
            <ul className="py-1 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <li key={n.id} className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                            <p className="text-sm text-gray-700">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </li>
                    ))
                ) : (
                    <li className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</li>
                )}
            </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
