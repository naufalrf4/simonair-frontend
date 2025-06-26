import { useAuth } from '@/features/authentication/context/AuthContext';
import { UserRole } from '@/features/authentication/context/AuthContext';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole | UserRole[];
}

/**
 * ProtectedRoute
 *
 * - Blokir akses jika belum login → redirect ke "/" dengan `redirect` path
 * - Blokir akses jika role tidak sesuai → redirect ke "/unauthorized"
 * - Tampilkan spinner saat auth masih loading
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState().location;

  const hasNavigated = useRef(false); // ✅ Prevent infinite redirect loop

  const requiredRoles = Array.isArray(roles)
    ? roles
    : roles
    ? [roles]
    : [];

  const hasRequiredRole =
    user && user.user_type && requiredRoles.length > 0
      ? requiredRoles.some(
          (role) => role.toLowerCase() === user.user_type.toLowerCase()
        )
      : true;

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    // ⛔ Cegah akses jika belum login, kecuali sudah di halaman root
    if (!isAuthenticated) {
      if (location.pathname !== '/') {
        navigate({
          to: '/',
          search: { redirect: location.pathname },
          replace: true,
        });
        hasNavigated.current = true;
      }
      return;
    }

    // ⛔ Role tidak sesuai
    if (!hasRequiredRole) {
      navigate({ to: '/unauthorized', replace: true });
      hasNavigated.current = true;
    }
  }, [isAuthenticated, isLoading, hasRequiredRole, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
