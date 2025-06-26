import { useState, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const useGoogleAuth = () => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = useCallback(() => {
    setGoogleLoading(true);
    window.location.href = `${BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(window.location.origin + "/dashboard")}`;
  }, []);

  return { handleGoogleLogin, googleLoading };
};
