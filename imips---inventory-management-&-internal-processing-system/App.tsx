
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import InquiriesPage from './pages/InquiriesPage';
import DiscountsPage from './pages/DiscountsPage';
import UsersPage from './pages/UsersPage';
import SecurityPage from './pages/SecurityPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// A wrapper for routes that require authentication
// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const PrivateRoute: React.FC<{ children: React.ReactElement, roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="inquiries" element={<InquiriesPage />} />
        <Route path="discounts" element={<PrivateRoute roles={['Admin', 'Manager']}><DiscountsPage /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute roles={['Admin']}><UsersPage /></PrivateRoute>} />
        <Route path="security" element={<PrivateRoute roles={['Admin']}><SecurityPage /></PrivateRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
