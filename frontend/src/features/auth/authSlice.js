import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Load initial state from localStorage
const userFromStorage = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;
const tokenFromStorage = localStorage.getItem('token') || null;

// Async Thunks
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.response?.data?.message || 'Registration failed');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (verificationData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/verify-otp', verificationData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Verification failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: userFromStorage,
    token: tokenFromStorage,
    loading: false,
    error: null,
    successMessage: null,
    requiresVerification: false,
    unverifiedEmail: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetVerification: (state) => {
      state.requiresVerification = false;
      state.unverifiedEmail = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (typeof payload === 'object' && payload?.requiresVerification) {
          state.requiresVerification = true;
          state.unverifiedEmail = payload.email;
          state.error = payload.message;
        } else {
          state.error = payload;
        }
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        if (action.payload.requiresVerification) {
          state.requiresVerification = true;
          state.unverifiedEmail = action.payload.email;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.requiresVerification = false;
        state.unverifiedEmail = null;
        state.successMessage = action.payload.message;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearMessages, resetVerification } = authSlice.actions;
export default authSlice.reducer;
