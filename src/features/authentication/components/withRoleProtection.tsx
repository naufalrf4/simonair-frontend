import { UserRole } from '@/features/authentication/context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

export function withRoleProtection(allowedRoles: UserRole[]) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedComponent(props: P) {
      return (
        <ProtectedRoute roles={allowedRoles}>
          <Component {...props} />
        </ProtectedRoute>
      );
    };
  };
}
