// store/slices/userSlice.ts
// User profile state

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  photoUrl?: string;
  
  // New Onboarding Fields
  work?: string;
  mobileNumber?: string;
  goalType?: string;
  targetWeight?: number;
  timeline?: string;
  motivationLevel?: number;
  experienceLevel?: string;
  recentActivity?: number;
  pushupTest?: number;
  squatTest?: number;
  workoutLocation?: string;
  equipmentAccess?: string[];
  daysPerWeek?: number;
  timePerSession?: number;
  jobNature?: string;
  dislikedExercises?: string[];
  trainingStyle?: string;
  medicalConditions?: string[];
  medicalScreening?: Record<string, any>;
  goals?: string[];
  activityLevel?: string;
  preferences?: string[];
  themePreference?: 'light' | 'midnight';
  
  subscription?: { status: string; planType: string; trialEndsAt?: string };
  streak?: number;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/profile/me');
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? 'Failed to load profile');
  }
});

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const res = await api.patch('/profile/me', data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Update failed');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      if (state.profile) state.profile.streak = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'midnight'>) => {
      if (state.profile) state.profile.themePreference = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfile.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = action.payload;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(updateProfile.pending, (state) => { state.isLoading = true; });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = { ...state.profile, ...action.payload } as UserProfile;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearUserProfile, updateStreak } = userSlice.actions;
export default userSlice.reducer;
