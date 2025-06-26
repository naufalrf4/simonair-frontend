import { useEffect, useRef } from 'react';
import { User } from '../context/AuthContext';
import { getUserData, getAccessToken, refreshAccessToken, clearAuthData } from '@/utils/apiClient';
import { parseJwt, isTokenExpired } from '../utils/token';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export const useAuthInitializer = (
  setUser: (user: User | null) => void,
  setError: (error: Error | null) => void,
  scheduleTokenExpiryLogout: (exp: number) => void,
  setIsInitializing: (initializing: boolean) => void
) => {
  const hasInitRun = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasInitRun.current) return;
    hasInitRun.current = true;

    let isMounted = true;
    const init = async () => {
      try {
        const storedUser = await getUserData();
        if (storedUser && isMounted) {
          setUser(storedUser as User);

          const token = await getAccessToken();
          if (token) {
            const decoded = parseJwt(token);

            if (decoded?.exp) {
              if (isTokenExpired(decoded.exp)) {
                try {
                  const refreshed = await refreshAccessToken();
                  const newDecoded = parseJwt(refreshed);
                  if (newDecoded?.exp) {
                    scheduleTokenExpiryLogout(newDecoded.exp);
                  }

                  const refreshedUser = await getUserData();
                  setUser(refreshedUser as User);
                  
                  return;
                } catch {
                  await clearAuthData();
                  setUser(null);
                  toast.error('Session expired. Please log in again.');
                  if (navigate) {
                    navigate({ to: '/' });
                  }
                  return;
                }
              }
              scheduleTokenExpiryLogout(decoded.exp);
            }
          } else {
            await clearAuthData();
            setUser(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          await clearAuthData();
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [navigate, scheduleTokenExpiryLogout, setUser, setError, setIsInitializing]);
};
