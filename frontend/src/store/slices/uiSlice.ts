
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface UiState {
  activeTab?: string;
  showAuthModal: boolean;
  showPricingModal: boolean;
  notifications: Notification[];
}

const initialState: UiState = {
  activeTab: 'upload',
  showAuthModal: false,
  showPricingModal: false,
  notifications: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setShowAuthModal: (state, action: PayloadAction<boolean>) => {
      state.showAuthModal = action.payload;
    },
    setShowPricingModal: (state, action: PayloadAction<boolean>) => {
      state.showPricingModal = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { 
  setActiveTab, 
  setShowAuthModal, 
  setShowPricingModal, 
  addNotification, 
  removeNotification, 
  clearNotifications 
} = uiSlice.actions;

export default uiSlice.reducer;
