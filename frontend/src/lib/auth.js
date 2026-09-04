'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import API from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token) {
        setUser(null);
        setLoading(false);
        if (!isPublicPage) {
          router.replace('/login');
        }
        return;
      }

      try {
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Verify token with backend
        const response = await API.get('/auth/me');
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } catch (err) {
        console.error('Session expired or invalid', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        if (!isPublicPage) {
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router, isPublicPage]);

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPage) {
        router.replace('/login');
      } else if (user && isPublicPage) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router, isPublicPage]);

  const login = async (identifier, password) => {
    try {
      const response = await API.post('/auth/login', {
        identifier,
        mot_de_passe: password,
      });

      const { token, user: loggedUser } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      router.replace('/dashboard');
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message || err.error || 'Identifiants ou mot de passe incorrect'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
