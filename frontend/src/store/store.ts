
import { configureStore } from '@reduxjs/toolkit';
import userSlice from './slices/userSlice';
import projectSlice from './slices/projectSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    user: userSlice,
    project: projectSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
