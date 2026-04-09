import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // CRITICAL: On Android, 10.0.2.2 is the standard bridge, 
  // but your actual machine IP is 10.16.211.223.
  if (Platform.OS === 'android') {
    const androidUrl = 'http://10.16.211.186:5000/api/v1';
    console.log(`🤖 Android Detected: Using LAN IP ${androidUrl}`);
    return androidUrl;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const localUrl = 'http://localhost:5000/api/v1';
  
  console.log(`📱 Base URL Check: Env=${envUrl || 'none'}, Default=${localUrl}`);
  return envUrl || localUrl;
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
// RESPONSE INTERCEPTOR — Handle 401 + refresh
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
    const message = error.response?.data?.message || error.message;
    console.error(`❌ [API ERROR] ${status || 'NETWORK'} ${url}`);
    console.error(`💥 Message: ${message}`);
    if (error.response?.data?.errors) {
      console.error('📋 Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    // ----------------------

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        // Refresh failed — clear tokens and redirect to login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // App will detect missing token and show login
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
