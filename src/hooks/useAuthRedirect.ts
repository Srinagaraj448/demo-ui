import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  fallbackPath?: string;
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { requireAuth = true, redirectTo = '/login', fallbackPath = '/super-admin' } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // Redirect to login if authentication is required but user is not authenticated
      navigate(redirectTo, { state: { from: location }, replace: true });
    } else if (!requireAuth && isAuthenticated) {
      // Redirect away from public routes if user is already authenticated
      navigate(fallbackPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, fallbackPath, navigate, location]);

  return { isAuthenticated, isLoading };
}; 