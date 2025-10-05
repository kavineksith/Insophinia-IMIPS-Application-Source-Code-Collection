
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import UsersPage from './pages/UsersPage';
import InquiriesPage from './pages/InquiriesPage';
import EmailPage from './pages/EmailPage';
import CatalogPage from './pages/CatalogPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import { Page } from './types';
import { ToastContainer } from './components/common/Toast';
import { useToast } from './hooks/useToast';
import { BuildingOffice2Icon } from '@heroicons/react/24/solid';
import NotFoundPage from './pages/NotFoundPage';
import DiscountsPage from './pages/DiscountsPage';
import ReportsPage from './pages/ReportsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import { useData } from './hooks/useData';
import SecurityPage from './pages/SecurityPage';
import NewsletterPage from './pages/NewsletterPage';

const App: React.FC = () => {
  const { user, logout, invalidatedSessionUserIds, isLoading } = useAuth();
  const { updateActivity } = useData();
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (invalidatedSessionUserIds.includes(user.id)) {
        showToast('You have been forcefully logged out by an administrator.', 'error');
        setTimeout(() => {
            logout();
        }, 1000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, invalidatedSessionUserIds, logout, showToast]);

  useEffect(() => {
    if (!user) return;

    // Initial activity ping on login
    updateActivity();

    const activityInterval = setInterval(() => {
        updateActivity();
    }, 30000); // every 30 seconds

    return () => clearInterval(activityInterval);
  }, [user, updateActivity]);


  const renderPage = () => {
    switch (currentPage) {
      case Page.Dashboard:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case Page.Inventory:
        return <InventoryPage />;
      case Page.Users:
        return <UsersPage />;
      case Page.Inquiries:
        return <InquiriesPage />;
      case Page.Email:
        return <EmailPage />;
      case Page.Catalog:
        return <CatalogPage />;
      case Page.Orders:
        return <OrdersPage />;
      case Page.Settings:
        return <SettingsPage />;
      case Page.Logs:
        return <LogsPage />;
      case Page.Discounts:
        return <DiscountsPage />;
      case Page.Reports:
        return <ReportsPage />;
      case Page.ActivityLog:
        return <ActivityLogPage />;
      case Page.Newsletters:
        return <NewsletterPage />;
      case Page.Security:
        return <SecurityPage />;
      default:
        return <NotFoundPage />;
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-brand-primary">
            <BuildingOffice2Icon className="h-20 w-20 animate-pulse" />
            <p className="mt-4 text-xl font-semibold">Loading Insophinia IMIPS...</p>
        </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginPage />
      ) : (
        <div className="relative flex h-screen bg-gray-100 font-sans overflow-hidden">
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header setIsSidebarOpen={setIsSidebarOpen} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
              {renderPage()}
            </main>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default App;
