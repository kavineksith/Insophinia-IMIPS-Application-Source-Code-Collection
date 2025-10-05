
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        const userData = await api.get<User>('/auth/me');
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user, logging out.", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    api.post('/auth/logout', {}).catch(err => console.error("Logout API call failed, continuing local logout.", err));
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, token, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
