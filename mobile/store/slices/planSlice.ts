// store/slices/planSlice.ts
// AI Plan state management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

interface DailyPlan {
  planId: string;
  version: number;
  isManuallyEdited: boolean;
  generatedAt: string;
  durationDays: number;
  plan: Record<string, any>;
}

interface PlanState {
  currentPlan: DailyPlan | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

const initialState: PlanState = {
  currentPlan: null,
  isLoading: false,
  isGenerating: false,
  error: null,
};

export const fetchTodayPlan = createAsyncThunk('plan/fetchToday', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/plan/today');
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? 'Failed to load plan');
  }
});

export const fetchPlanByDate = createAsyncThunk('plan/fetchByDate', async (date: string, { rejectWithValue }) => {
  try {
    const res = await api.get(`/plan/date?date=${date}`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? 'No plan for this date');
  }
});

export const generatePlanThunk = createAsyncThunk(
  'plan/generate',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      console.log('🤖 [AI] Requesting new fitness plan generation...');
      const res = await api.post('/ai/generate-plan', data);
      console.log('✨ [AI] Plan generated and saved successfully!');
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'AI plan generation failed';
      console.error(`❌ [AI ERROR] ${message}`);
      return rejectWithValue(message);
    }
  }
);

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    clearPlan: (state) => {
      state.currentPlan = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTodayPlan.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchTodayPlan.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentPlan = action.payload;
    });
    builder.addCase(fetchTodayPlan.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(generatePlanThunk.pending, (state) => { state.isGenerating = true; state.error = null; });
    builder.addCase(generatePlanThunk.fulfilled, (state, action) => {
      state.isGenerating = false;
      state.currentPlan = action.payload;
    });
    builder.addCase(generatePlanThunk.rejected, (state, action) => {
      state.isGenerating = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearPlan } = planSlice.actions;
export default planSlice.reducer;
