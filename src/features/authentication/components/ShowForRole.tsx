import { useAuth } from '@/features/authentication/context/AuthContext';
import { UserRole } from '@/features/authentication/context/AuthContext';

type ShowForRoleProps = {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * ShowForRole - Wrapper component to show content only for users with specific roles
 *
 * @param roles - Allowed roles, can be a string or an array
 * @param children - Component to show if role matches
 * @param fallback - Optional, fallback content if role does not match
 */
export const ShowForRole = ({ roles, children, fallback = null }: ShowForRoleProps) => {
  const { hasRole } = useAuth();

  const allowed = hasRole(roles);

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
};
