// store/slices/authSlice.ts
// Authentication state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, saveTokens, clearTokens } from '../../utils/api';

export interface AuthUser {
  id: string;
  name: string;
  role: 'NORMAL_USER' | 'GYM_OWNER' | 'TRAINER';
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ─── Async Thunks ───

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const { token, refreshToken, user } = res.data.data;
      await saveTokens(token, refreshToken);
      return { token, user };
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Login failed';
      console.error(`👤 [LOGIN FAILED] ${message}`);
      return rejectWithValue(message);
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', data);
      console.log('Registration response:', res.data);
      const { token, refreshToken, userId, role } = res.data.data;
      await saveTokens(token, refreshToken);
      return { token, user: { id: userId, role, name: (data.name as string) } };
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Registration failed';
      console.error(`📝 [REGISTRATION FAILED] ${message}`);
      if (!err.response) {
        console.error('🌐 Network error detected. Is the backend running?');
        return rejectWithValue(`Connection Error: ${err.message}. Check backend/IP.`);
      }
      return rejectWithValue(message);
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore logout API errors
  } finally {
    await clearTokens();
  }
});

// ─── Slice ───

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // REGISTER
    builder.addCase(registerThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user as AuthUser;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // LOGOUT
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });
  },
});

export const { setCredentials, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
