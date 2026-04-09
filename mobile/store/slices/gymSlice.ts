// store/slices/gymSlice.ts
// Redux slice for managing selected gym state for owners

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GymState {
  selectedGymId: string | null;
  activeGymDetails: any | null;
}

const initialState: GymState = {
  selectedGymId: null,
  activeGymDetails: null,
};

const gymSlice = createSlice({
  name: 'gym',
  initialState,
  reducers: {
    setSelectedGymId: (state, action: PayloadAction<string | null>) => {
      state.selectedGymId = action.payload;
    },
    setActiveGymDetails: (state, action: PayloadAction<any | null>) => {
      state.activeGymDetails = action.payload;
      if (action.payload) {
        state.selectedGymId = action.payload.id;
      }
    },
    clearGymState: (state) => {
      state.selectedGymId = null;
      state.activeGymDetails = null;
    },
  },
});

export const { setSelectedGymId, setActiveGymDetails, clearGymState } = gymSlice.actions;
export default gymSlice.reducer;
