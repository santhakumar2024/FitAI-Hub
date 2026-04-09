// store/index.ts
// Redux Toolkit store configuration

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import planReducer from './slices/planSlice';
import logReducer from './slices/logSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    plan: planReducer,
    log: logReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
