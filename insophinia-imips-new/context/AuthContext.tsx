

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { apiLogin, getMe, apiLogout, getCsrfToken, setCsrfToken as setApiCsrfToken } from '../lib/api';
import { logger } from '../lib/logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  invalidatedSessionUserIds: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  forceLogoutUser: (userId: string) => void;
  reauthenticate: (password: string) => Promise<boolean>;
  updateAuthenticatedUser: (updatedData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invalidatedSessionUserIds, setInvalidatedSessionUserIds] = useState<string[]>([]);
  
  useEffect(() => {
    const restoreSession = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const csrfToken = await getCsrfToken();
                setApiCsrfToken(csrfToken);
                const sessionUser = await getMe();
                if (sessionUser) {
                    setUser(sessionUser);
                    logger.setUserId(sessionUser.id);
                    logger.info('User session restored', { email: sessionUser.email });
                }
            } catch (error) {
                logger.warn('Session restore failed: Invalid token.', error);
                localStorage.removeItem('authToken');
            }
        }
        setIsLoading(false);
    };
    restoreSession();
  }, []);


  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await apiLogin(email, password);
        if (response) {
          const { user, accessToken } = response;
          localStorage.setItem('authToken', accessToken);
          const csrfToken = await getCsrfToken();
          setApiCsrfToken(csrfToken);
          setUser(user);
          logger.setUserId(user.id);
          setInvalidatedSessionUserIds(prev => prev.filter(id => id !== user.id));
          logger.info('User login successful', { email: user.email, role: user.role });
          return { success: true };
        }
        logger.warn('User login failed: Invalid credentials provided', { email });
        return { success: false, message: 'Invalid email or password.' };
    } catch (error: any) {
        logger.error('User login failed: API error', error, { email });
        return { success: false, message: error.response?.data?.message || 'An unknown error occurred.' };
    }
  };

  const logout = async () => {
    if (user) {
      try {
        await apiLogout();
        logger.info('User logged out successfully via API', { email: user.email });
      } catch(error) {
        logger.error('API logout failed, proceeding with local logout', error, { email: user?.email });
      }
    }
    localStorage.removeItem('authToken');
    setApiCsrfToken(''); // Clear CSRF token
    setUser(null);
    logger.setUserId(null);
  };
  
  const forceLogoutUser = (userId: string) => {
    logger.warn('Admin forced logout for user', { userId });
    setInvalidatedSessionUserIds(prev => [...new Set([...prev, userId])]);
  };

  const reauthenticate = async (password: string): Promise<boolean> => {
    if (user) {
        try {
            const response = await apiLogin(user.email, password);
            if (response) {
              logger.info('User re-authentication successful', { email: user.email });
              return true;
            }
            logger.warn('User re-authentication failed', { email: user.email });
            return false;
        } catch (error) {
            logger.error('User re-authentication failed: API error', error, { email: user.email });
            return false;
        }
    }
    return false;
  }

  const updateAuthenticatedUser = (updatedData: Partial<User>) => {
    if (user) {
      setUser(prevUser => ({ ...prevUser!, ...updatedData }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, invalidatedSessionUserIds, login, logout, forceLogoutUser, reauthenticate, updateAuthenticatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};
