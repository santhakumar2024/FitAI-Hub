// store/index.ts
// Redux Toolkit store configuration

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import planReducer from './slices/planSlice';
import logReducer from './slices/logSlice';
import gymReducer from './slices/gymSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    plan: planReducer,
    log: logReducer,
    gym: gymReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
