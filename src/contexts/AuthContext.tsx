import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/apiService';
import { SessionExpiredDialog } from '@/components/SessionExpiredDialog';

interface User {
  userId: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (email: string) => Promise<boolean>;
  handleSessionExpired: () => void;
}

// ---------------------------------------------------------------------------
// UI-ONLY DEMO BYPASS
// This is a presentation prototype on a local copy that has NO backend connected.
// When enabled, any valid-looking email + non-empty password logs in with a local
// mock token so the dashboard can be reviewed offline. Set VITE_MOCK_AUTH=false
// (or remove the .env file) to restore the real API login. No backend is touched.
// ---------------------------------------------------------------------------
const MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH !== 'false';
const MOCK_USER_ID = 'mock-super-admin';

function createMockToken(email: string): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: MOCK_USER_ID,
      email,
      role: 'super_admin',
      exp: nowSec + 8 * 60 * 60,
      iat: nowSec,
    })
  );
  return `${header}.${payload}.mock-signature`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);
  const navigate = useNavigate();
  const navigationInProgress = useRef(false);
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef<number | null>(null);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Register session expired callback with API service
    apiService.setSessionExpiredCallback(handleSessionExpired);
    checkAuthStatus();
    // Setup token refresh if tokens already exist on load
    setupTokenRefresh();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Check if token is expired
        if (isTokenExpired(token)) {
          // Clear everything and don't show dialog on initial load
          clearAuthData();
          if (mountedRef.current) {
            setIsLoading(false);
          }
          return;
        }

        // You can add a token validation API call here
        // For now, we'll just check if token exists
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail && mountedRef.current) {
          setUser({
            userId: localStorage.getItem('userId') || '',
            email: userEmail,
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearAuthData();
    }
    if (mountedRef.current) {
      setIsLoading(false);
    }
  };

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    apiService.loggedInUserId = null;
    if (refreshIntervalRef.current) {
      window.clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const isTokenExpired = (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // If no expiration, assume valid
      
      // Check if token is expired (with 30 second buffer)
      return payload.exp < (Date.now() / 1000) + 30;
    } catch (error) {
      return true; // If can't decode, assume expired
    }
  };

  const handleSessionExpired = useCallback(() => {
    // Only show dialog if not already showing and user is authenticated and component is mounted
    if (!showSessionExpiredDialog && user && mountedRef.current && !navigationInProgress.current) {
      console.log('Session expired, showing dialog');
      setShowSessionExpiredDialog(true);
    }
  }, [showSessionExpiredDialog, user]);

  const setupTokenRefresh = useCallback(() => {
    if (MOCK_AUTH) return;
    if (refreshIntervalRef.current) {
      window.clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) return;

    const intervalId = window.setInterval(async () => {
      try {
        const result = await apiService.refreshAccessToken();
        if (!result.success) {
          handleSessionExpired();
        }
      } catch (e) {
        handleSessionExpired();
      }
    }, 29 * 60 * 1000);
    refreshIntervalRef.current = intervalId;
  }, [handleSessionExpired]);

  const handleRedirectToLogin = useCallback(() => {
    if (navigationInProgress.current || !mountedRef.current) {
      console.log('Navigation already in progress or component unmounted, skipping');
      return;
    }

    console.log('Redirecting to login from session expired dialog');
    navigationInProgress.current = true;
    
    // Close dialog immediately
    setShowSessionExpiredDialog(false);
    
    // Clear user state immediately
    setUser(null);
    clearAuthData();
    
    // Use setTimeout to ensure state updates have been processed
    setTimeout(() => {
      if (mountedRef.current) {
        try {
          // Navigate with session expired state to help login page handle the transition
          navigate('/login', { 
            replace: true, 
            state: { sessionExpired: true, message: 'Your session has expired. Please log in again.' }
          });
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback to window.location if navigate fails
          window.location.href = '/login';
        } finally {
          navigationInProgress.current = false;
        }
      }
    }, 0);
  }, [navigate, clearAuthData]);

  const verifyEmail = async (email: string): Promise<boolean> => {
    if (MOCK_AUTH) {
      localStorage.setItem('accessToken', createMockToken(email));
      return true;
    }
    try {
      const response = await apiService.verifyEmail(email);
      if (response.success && response.token) {
        localStorage.setItem('accessToken', response.token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (MOCK_AUTH) {
      if (!password) return false;
      const userData = { userId: MOCK_USER_ID, email, name: 'Super Admin' };
      setUser(userData);
      const mockToken = createMockToken(email);
      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('refreshToken', mockToken);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', MOCK_USER_ID);
      apiService.loggedInUserId = MOCK_USER_ID;
      return true;
    }
    try {
      const response = await apiService.login(email, password);
      if (response.success && mountedRef.current) {
        const userData = {
          userId: response.data.userId,
          email: email,
          name: response.data.name,
        };
        
        setUser(userData);
        
        if (response.data?.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
        }
        if (response.data?.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', response.data.userId);
        
        apiService.loggedInUserId = response.data.userId;
        // setupTokenRefresh();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = useCallback(() => {
    if (navigationInProgress.current || !mountedRef.current) {
      console.log('Navigation already in progress or component unmounted, skipping logout');
      return;
    }

    console.log('Manual logout called');
    navigationInProgress.current = true;
    
    setUser(null);
    clearAuthData();
    
    // Close any open dialogs
    setShowSessionExpiredDialog(false);
    
    setTimeout(() => {
      if (mountedRef.current) {
        try {
          navigate('/login', { replace: true });
        } catch (error) {
          console.error('Logout navigation error:', error);
          // Fallback to window.location if navigate fails
          window.location.href = '/login';
        } finally {
          navigationInProgress.current = false;
        }
      }
    }, 0);
  }, [navigate, clearAuthData]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    verifyEmail,
    handleSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredDialog
        isOpen={showSessionExpiredDialog}
        onRedirectToLogin={handleRedirectToLogin}
      />
    </AuthContext.Provider>
  );
}; 