import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { apiLogin } from '../lib/api';
import { logger } from '../lib/logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  invalidatedSessionUserIds: string[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
    // Session restoration is not possible with the provided backend, as it lacks an endpoint 
    // to validate a token and retrieve user data. To prevent errors and ensure correct
    // behavior, we will start with a null user and require a login on each page load.
    setIsLoading(false);
  }, []);


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
        const response = await apiLogin(email, password);
        if (response) {
          const { user, accessToken } = response;
          localStorage.setItem('authToken', accessToken);
          setUser(user);
          setInvalidatedSessionUserIds(prev => prev.filter(id => id !== user.id));
          logger.info('User login successful', { email: user.email, role: user.role });
          return true;
        }
        logger.warn('User login failed: Invalid credentials provided', { email });
        return false;
    } catch (error) {
        logger.error('User login failed: API error', error, { email });
        return false;
    }
  };

  const logout = () => {
    if (user) {
      logger.info('User logged out', { email: user.email });
    }
    localStorage.removeItem('authToken');
    setUser(null);
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
