import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { loginUser, logoutUser, getUserData, clearAuthData } from '@/utils/apiClient';
import { parseJwt } from '../utils/token';

export const useAuthMutations = (setUser: (user: any | null) => void, setError: (error: Error | null) => void) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = router ? router.navigate : null;

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await loginUser(email, password);
      const token = res?.access_token;
      if (!token) throw new Error('Invalid token');

      const decoded = parseJwt(token);
      if (decoded?.exp) {
        window.dispatchEvent(new CustomEvent('auth:loginSuccess', { detail: { exp: decoded.exp } }));
      }
      return res;
    },
    onSuccess: async () => {
      const stored = await getUserData();
      if (stored) {
        setUser(stored);
        toast.success('Login berhasil!');
      }
    },
    onError: (error: any) => {
      setError(error);
      toast.error(error?.response?.data?.message || 'Login gagal. Periksa kredensial Anda.');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      setUser(null);
      await clearAuthData();
      queryClient.clear();

      if (navigate) {
        navigate({ to: '/' });
      } else {
        window.location.href = '/';
      }

      toast.success('Logout berhasil');
    },
    onError: async () => {
      setUser(null);
      await clearAuthData();
      toast.error('Gagal logout dari server. Anda telah keluar dari sesi.');
    },
  });

  return { loginMutation, logoutMutation };
};
