import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from '../services/authService';

const AuthContext = createContext();

const formatUserData = (rawUser) => {
  if (!rawUser) return null;
  const isSuperAdmin = rawUser.role === 'super_admin';
  const isSchoolAdmin = rawUser.role === 'school_admin';

  let schoolId = null;
  let schoolName = isSuperAdmin ? 'All Platform Schools' : 'School Portal';
  let schoolCode = null;

  if (rawUser.schoolId) {
    if (typeof rawUser.schoolId === 'object') {
      schoolId = rawUser.schoolId._id || rawUser.schoolId.id;
      schoolName = rawUser.schoolId.name || schoolName;
      schoolCode = rawUser.schoolId.code || schoolCode;
    } else {
      schoolId = rawUser.schoolId;
    }
  }

  return {
    ...rawUser,
    id: rawUser.id || rawUser._id,
    isSuperAdmin,
    isSchoolAdmin,
    schoolId,
    schoolName,
    schoolCode,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return cached ? formatUserData(JSON.parse(cached)) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res?.success && res?.data) {
        const formatted = formatUserData(res.data);
        setUser(formatted);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.data));
      } else {
        throw new Error('Failed to verify token');
      }
    } catch (err) {
      // Offline fallback: check cached user data
      const cached = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (cached) {
        try {
          setUser(formatUserData(JSON.parse(cached)));
          setIsAuthenticated(true);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [checkAuth]);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(email, password);
      if (res?.success && res?.data) {
        const { accessToken, refreshToken, user: rawUser } = res.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(rawUser));

        const formatted = formatUserData(rawUser);
        setUser(formatted);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      const msg = res?.message || 'Login failed';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    } catch (err) {
      const msg = err.userMessage || err.message || 'Login failed';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const registerSchool = async (schoolData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.registerSchool(schoolData);
      if (res?.success && res?.data) {
        const { accessToken, refreshToken, user: rawUser } = res.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(rawUser));

        const formatted = formatUserData(rawUser);
        setUser(formatted);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      const msg = res?.message || 'Registration failed';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    } catch (err) {
      const msg = err.userMessage || err.message || 'Registration failed';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        registerSchool,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
