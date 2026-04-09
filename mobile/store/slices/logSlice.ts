// store/slices/logSlice.ts
// Daily Logs state management

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

interface LogState {
  logs: any[];
  todayLog: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LogState = {
  logs: [],
  todayLog: null,
  isLoading: false,
  error: null,
};

export const fetchDailyLogs = createAsyncThunk('log/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/logs/daily');
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? 'Failed to load logs');
  }
});

export const createDailyLogThunk = createAsyncThunk(
  'log/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await api.post('/logs/daily', data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to save log');
    }
  }
);

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    clearLogs: (state) => {
      state.logs = [];
      state.todayLog = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDailyLogs.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchDailyLogs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.todayLog = action.payload;
    });
    builder.addCase(fetchDailyLogs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(createDailyLogThunk.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(createDailyLogThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.todayLog = action.payload;
    });
    builder.addCase(createDailyLogThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearLogs } = logSlice.actions;
export default logSlice.reducer;
