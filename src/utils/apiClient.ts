import axios from 'axios';
import { getBrowserFingerprint } from './fingerprint';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


// ---------- Debug Interceptors ----------
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 Response [${response.status}] from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response || error);
    return Promise.reject(error);
  },
);

// ---------- JWT Decode ----------
function parseJwt(token: string): { exp?: number } {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

// ---------- Encryption ----------
function encryptData(data: string, fingerprint: string): string {
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ fingerprint.charCodeAt(i % fingerprint.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
}

function decryptData(encryptedData: string, fingerprint: string): string {
  try {
    const data = atob(encryptedData);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ fingerprint.charCodeAt(i % fingerprint.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch {
    return '';
  }
}

// ---------- Token Storage ----------
export async function setAccessToken(token: string): Promise<void> {
  const fingerprint = await getBrowserFingerprint();
  const encrypted = encryptData(token, fingerprint);
  localStorage.setItem(`access_token_${fingerprint}`, encrypted);
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const fingerprint = await getBrowserFingerprint();
    const encrypted = localStorage.getItem(`access_token_${fingerprint}`);
    if (!encrypted) return null;
    return decryptData(encrypted, fingerprint);
  } catch {
    return null;
  }
}

// ---------- Storage ----------
export async function setUserData(userData: Record<string, any>) {
  const fingerprint = await getBrowserFingerprint();
  const encrypted = encryptData(JSON.stringify(userData), fingerprint);
  localStorage.setItem(`user_data_${fingerprint}`, encrypted);
}

export async function getUserData(): Promise<Record<string, any> | null> {
  try {
    const fingerprint = await getBrowserFingerprint();
    const encrypted = localStorage.getItem(`user_data_${fingerprint}`);
    if (!encrypted) return null;
    const decrypted = decryptData(encrypted, fingerprint);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch {
    return null;
  }
}

export async function clearAuthData(): Promise<void> {
  try {
    const fingerprint = await getBrowserFingerprint();
    localStorage.removeItem(`user_data_${fingerprint}`);
    localStorage.removeItem(`access_token_${fingerprint}`);
  } catch {
    localStorage.removeItem('user_data');
    localStorage.removeItem('access_token');
  }
}

// ---------- Auth Token Interceptor ----------
apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Auto Refresh Token on 401 ----------
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function refreshAccessToken(): Promise<string> {
  try {
    const response = await apiClient.post('/auth/refresh', undefined, {
      withCredentials: true,
    });

    const token = response.data?.data?.access_token;
    if (!token) throw new Error('No token');

    const decoded = parseJwt(token);
    if (!decoded?.exp || isNaN(decoded.exp)) throw new Error('Invalid token');

    await setAccessToken(token);
    console.info('Access token refreshed');
    window.dispatchEvent(new Event('auth:refresh'));
    return token;
  } catch (err) {
    console.warn('Token refresh failed', err);
    throw err;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          onRefreshed(newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          await clearAuthData();
          window.dispatchEvent(new Event('auth:logout'));
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (token: string) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          try {
            resolve(apiClient(originalRequest));
          } catch (err) {
            reject(err);
          }
        });
      });
    }
    return Promise.reject(error);
  },
);

// ---------- Login ----------
export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const token = response.data?.data?.access_token;
  if (!token) throw new Error('No access token returned');

  await setAccessToken(token);

  const user = response.data?.data?.user;
  if (!user) throw new Error('No user data returned');
  const userData = {
    id: user.id,
    email: user.email,
    name: user.fullName,
    user_type: user.role,
  };

  await setUserData(userData);
  window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: userData } }));

  return response.data.data;
};

// ---------- Register ----------
export const registerUser = async (fullName: string, email: string, password: string) => {
  const response = await apiClient.post('/auth/register', { fullName, email, password });
  const token = response.data?.data?.access_token;
  if (!token) throw new Error('No access token returned');

  await setAccessToken(token);

  const user = response.data?.data?.user;
  if (!user) throw new Error('No user data returned');
  const userData = {
    id: user.id,
    email: user.email,
    name: user.fullName,
    user_type: user.role,
  };

  await setUserData(userData);
  window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: userData } }));

  return response.data.data;
};

// ---------- Logout ----------
export const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
  await clearAuthData();
  window.dispatchEvent(new Event('auth:logout'));
};

// ---------- Forgot Password ----------
export async function requestForgotPassword(email: string) {
  await apiClient.post('/auth/forgot-password', { email });
}

// ---------- Reset Password ----------
export async function resetPassword(token: string, password: string, confirmPassword: string) {
  return apiClient.post('/auth/reset-password', { token, password, confirmPassword });
}

// ---------- Validate Reset Token ----------
export async function validateResetToken(token: string) {
  return apiClient.get(`/auth/reset-password/validate/${token}`);
}

export default apiClient;
