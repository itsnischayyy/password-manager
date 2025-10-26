import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/state/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const vaultKey = useAuthStore((state) => state.vaultKey);
  const location = useLocation();

  if (!isAuthenticated || !vaultKey) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}