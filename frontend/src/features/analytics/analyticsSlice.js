import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAnalytics = createAsyncThunk('analytics/fetchOverview', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/analytics/overview');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    kpis: null,
    volumeData: [],
    priorityData: [],
    statusData: [],
    categoryData: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload.kpis;
        state.volumeData = action.payload.volumeData;
        state.priorityData = action.payload.priorityData;
        state.statusData = action.payload.statusData;
        state.categoryData = action.payload.categoryData;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
