import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoadingSession: boolean;
  language: 'en' | 'hi' | 'bn';
  setLanguage: (lang: 'en' | 'hi' | 'bn') => void;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('netra_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  const [language, setLanguage] = useState<'en' | 'hi' | 'bn'>(() => {
    return (localStorage.getItem('netra_lang') as any) || 'en';
  });

  // Verify stored session token on page load
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('netra_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('netra_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Stored token expired or invalid:', err);
          localStorage.removeItem('netra_token');
          localStorage.removeItem('netra_user');
          setUser(null);
        }
      } else {
        // No token, ensure user is cleared
        localStorage.removeItem('netra_user');
        setUser(null);
      }
      setIsLoadingSession(false);
    };

    verifySession();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('netra_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('netra_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('netra_lang', language);
  }, [language]);

  const logout = () => {
    localStorage.removeItem('netra_token');
    localStorage.removeItem('netra_user');
    localStorage.removeItem('netra_latest_screening');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoadingSession, language, setLanguage, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
