import {
  clearAuthData,
} from '@/utils/apiClient';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { createContext, ReactNode, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuthMutations } from '../hooks/useAuthMutations';
import { useAuthInitializer } from '../hooks/useAuthInitializer';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'user';

export type User = {
  id: string;
  email: string;
  name: string;
  user_type: UserRole;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const queryClient = new QueryClient();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const router = useRouter();
  const navigate = router ? router.navigate : null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderContent
        children={children}
        setUser={setUser}
        user={user}
        error={error}
        setError={setError}
        navigate={navigate}
      />
    </QueryClientProvider>
  );
};

const AuthProviderContent = ({
  children,
  setUser,
  user,
  error,
  setError,
  navigate,
}: {
  children: ReactNode;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  user: User | null;
  error: Error | null;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  navigate: any;
}) => {
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(true);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { loginMutation, logoutMutation } = useAuthMutations(setUser, setError);

  const login = useCallback(async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const scheduleTokenExpiryLogout = useCallback((exp: number) => {
    const msUntilExpiry = (exp - Math.floor(Date.now() / 1000)) * 1000;

    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (msUntilExpiry > 0) {
      logoutTimerRef.current = setTimeout(async () => {
        await logout();
        toast.info('Session expired. Logged out.');
      }, msUntilExpiry);
    }
  }, [logout]);

  useAuthInitializer(setUser, setError, scheduleTokenExpiryLogout, setIsInitializing);

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user) return false;
    return Array.isArray(role) ? role.includes(user.user_type) : user.user_type === role;
  }, [user]);

  const authContextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading: isInitializing || loginMutation.isPending || logoutMutation.isPending,
    error,
    login,
    logout,
    hasRole,
  }), [user, isInitializing, loginMutation.isPending, logoutMutation.isPending, error, login, logout, hasRole]);

  useEffect(() => {
    let isMounted = true;

    const handleLogin = async (event: CustomEvent<{ user: User }>) => {
      const userData = event.detail.user;
      if (userData && isMounted) {
        setUser(userData);
      }
    };

    const handleLogout = async () => {
      if (isMounted) {
        setUser(null);
      }
      await clearAuthData();
      if (navigate) {
        navigate({ to: '/' });
      } else {
        window.location.href = '/';
      }
    };

    const removeLoginListener = addAsyncEventListener<CustomEvent<{ user: User }>>(
      'auth:login',
      handleLogin,
    );
    const removeLogoutListener = addAsyncEventListener<Event>('auth:logout', handleLogout);

    const handleLoginSuccess = (event: CustomEvent<{ exp: number }>) => {
      if (event.detail.exp) {
        scheduleTokenExpiryLogout(event.detail.exp);
      }
    };

    const removeLoginSuccessListener = addAsyncEventListener<CustomEvent<{ exp: number }>>(
      'auth:loginSuccess',
      handleLoginSuccess,
    );

    return () => {
      isMounted = false;
      removeLoginListener();
      removeLogoutListener();
      removeLoginSuccessListener();
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [navigate, scheduleTokenExpiryLogout, setUser, logout]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

function addAsyncEventListener<T extends Event>(
  type: string,
  listener: (event: T) => Promise<void> | void,
) {
  const wrappedListener = (event: T) => {
    try {
      const result = listener(event);
      if (result instanceof Promise) {
        result.catch((error) => {
          if (import.meta.env.MODE === 'development') {
            console.error(`Error in event listener for ${type}:`, error);
          }
        });
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error(`Error in event listener for ${type}:`, error);
      }
    }
  };

  window.addEventListener(type, wrappedListener as EventListener);
  return () => window.removeEventListener(type, wrappedListener as EventListener);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
