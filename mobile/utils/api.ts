import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // ✅ Always read from .env first — update EXPO_PUBLIC_API_BASE_URL when your IP changes.
  //    Run `ipconfig` on Windows to get your current LAN IP.
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Fallback: localhost works for iOS Simulator and Web only.
  // For Android device/emulator you MUST set EXPO_PUBLIC_API_BASE_URL in .env
  const fallback = Platform.OS === 'android'
    ? 'http://10.16.211.203:5000/api/v1'  // last known IP — update .env instead
    : 'http://localhost:5000/api/v1';

  const url = envUrl || fallback;
  console.log(`🔗 [${Platform.OS.toUpperCase()}] API base: ${url} (env=${envUrl ? '✅' : '❌ using fallback'})`);
  return url;
};

const BASE_URL = getBaseUrl();
console.log('🔗 Connecting to Backend at:', BASE_URL);

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────
// REQUEST INTERCEPTOR — Inject auth token
// ─────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // --- LOGGING ---
    console.log(`\n🚀 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      const logBody = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      console.log('📦 Body:', JSON.stringify(logBody, null, 2).substring(0, 500) + (JSON.stringify(logBody).length > 500 ? '...' : ''));
    }
    // ---------------

    return config;
  },
  (error) => {
    console.error('❌ [REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR — Handle 401 + refresh + Global Error Formatting
// ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // --- LOGGING ---
    console.log(`✅ [RESPONSE] ${response.status} ${response.config.url}`);
    if (response.data) {
      console.log('📄 Data:', JSON.stringify(response.data, null, 2).substring(0, 300) + (JSON.stringify(response.data).length > 300 ? '...' : ''));
    }
    // ---------------
    return response;
  },
  async (error) => {
    // --- LOGGING ERROR ---
    const status = error.response?.status;
    const url = error.config?.url;
    
    // Normalize user-friendly message
    let userMessage = 'Something went wrong. Please try again.';
    
    if (!error.response) {
      userMessage = 'Connection Error: Unable to reach the server. Check your internet or backend IP.';
    } else if (error.response?.data?.message) {
      userMessage = error.response.data.message;
    } else if (status === 404) {
      userMessage = 'Resource not found or API endpoint is invalid (404).';
    } else if (status === 500) {
      userMessage = 'Internal Server Error. Our team has been notified.';
    }

    if (status === 404) {
      console.warn(`⚠️ [API WARN] 404 ${url}`);
      console.warn(`💬 Message: ${userMessage}`);
    } else {
      console.error(`❌ [API ERROR] ${status || 'NETWORK'} ${url}`);
      console.error(`💥 Message: ${userMessage}`);
    }
    
    // Attach userMessage to the error object for screens to use
    error.userMessage = userMessage;

    if (error.response?.data?.errors) {
      console.error('📋 Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    // ----------------------

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized (Token Refresh)
    if (status === 401 && !originalRequest._retry) {
      console.log('🔄 Token expired, attempting refresh...');
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data.data;

        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        console.log('✨ Token refreshed successfully!');
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('💀 Refresh failed, logging out...');
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// TOKEN STORAGE HELPERS
// ─────────────────────────────────────────
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

export const getAccessToken = async () => {
  return SecureStore.getItemAsync('accessToken');
};
