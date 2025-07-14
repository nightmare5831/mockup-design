
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, updateApiToken } from '@/service/api';
import { creditsApi } from '@/service/api/creditsApi';
import { UserRole, UserProfile } from '@/types';

interface UserState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    role?: UserRole;
    credits: number;
    plan: 'free' | 'basic' | 'pro' | 'premium';
    total_credits?: number;
    used_credits?: number;
    total_mockups?: number;
    has_active_subscription?: boolean;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login({ email, password });
      
      // Store JWT token
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      updateApiToken(response.access_token);
      
      return {
        id: response.user.id,
        email: response.user.email,
        name: response.user.first_name && response.user.last_name 
          ? `${response.user.first_name} ${response.user.last_name}`
          : response.user.email.split('@')[0],
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        role: response.user.role,
        credits: 3, // Default credits, should be fetched from user profile
        plan: 'free' as const
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async ({ email, password, firstName, lastName }: { 
    email: string; 
    password: string; 
    firstName?: string; 
    lastName?: string; 
  }, { rejectWithValue }) => {
    try {
      const response = await authApi.register({ email, password, first_name: firstName, last_name: lastName });
      
      // For registration, we might need to login afterwards to get the token
      // or the API might return a token directly
      return {
        id: response.user.id,
        email: response.user.email,
        name: response.user.first_name && response.user.last_name 
          ? `${response.user.first_name} ${response.user.last_name}`
          : response.user.email.split('@')[0],
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        role: response.user.role,
        credits: 10, // Default credits
        plan: 'free' as const
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const verifyToken = createAsyncThunk(
  'user/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getCurrentUser();
      
      return {
        id: response.id,
        email: response.email,
        name: response.first_name && response.last_name 
          ? `${response.first_name} ${response.last_name}`
          : response.email.split('@')[0],
        first_name: response.first_name,
        last_name: response.last_name,
        role: response.role,
        credits: response.total_credits - response.used_credits,
        total_credits: response.total_credits,
        used_credits: response.used_credits,
        total_mockups: response.total_mockups,
        has_active_subscription: response.has_active_subscription,
        plan: response.has_active_subscription ? 'pro' as const : 'free' as const
      };
    } catch (error: any) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return rejectWithValue(error.message || 'Token verification failed');
    }
  }
);

// Refresh user credits
export const refreshCredits = createAsyncThunk(
  'user/refreshCredits',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        creditsApi.setToken(token);
      }
      const balance = await creditsApi.getCreditBalance();
      return balance.remaining_credits;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh credits');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
    clearError: (state) => {
      state.error = null;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.credits = action.payload;
      }
    },
    updatePlan: (state, action: PayloadAction<'free' | 'basic' | 'pro' | 'premium'>) => {
      if (state.user) {
        state.user.plan = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Verify Token
    builder
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Refresh Credits
    builder
      .addCase(refreshCredits.fulfilled, (state, action) => {
        if (state.user) {
          state.user.credits = action.payload;
        }
      })
      .addCase(refreshCredits.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, updateCredits, updatePlan } = userSlice.actions;
export default userSlice.reducer;
