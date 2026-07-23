import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// --- PROFILE ---
export const fetchProfile = createAsyncThunk('settings/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/profile');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
  }
});

export const updateProfile = createAsyncThunk('settings/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await api.put('/settings/profile', data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
  }
});

// --- TEAM ---
export const fetchTeam = createAsyncThunk('settings/fetchTeam', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/team');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch team');
  }
});

export const inviteMember = createAsyncThunk('settings/inviteMember', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/settings/team/invite', data);
    return response.data; // Includes the tempPassword
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to invite member');
  }
});

export const updateRole = createAsyncThunk('settings/updateRole', async ({ id, role }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/settings/team/${id}/role`, { role });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update role');
  }
});

export const removeMember = createAsyncThunk('settings/removeMember', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/settings/team/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove member');
  }
});

// --- ORG SETTINGS ---
export const fetchOrgSettings = createAsyncThunk('settings/fetchOrg', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/org');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch org settings');
  }
});

export const updateOrgSettings = createAsyncThunk('settings/updateOrg', async (data, { rejectWithValue }) => {
  try {
    const response = await api.put('/settings/org', data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update org settings');
  }
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    profile: null,
    team: [],
    org: null,
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearSettingsMessages: (state) => {
      state.error = null;
      state.successMsg = null;
    }
  },
  extraReducers: (builder) => {
    // Shared Loading/Error handlers
    const setPending = (state) => { state.loading = true; state.error = null; state.successMsg = null; };
    const setError = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      // Profile
      .addCase(fetchProfile.pending, setPending)
      .addCase(fetchProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
      .addCase(fetchProfile.rejected, setError)
      .addCase(updateProfile.pending, setPending)
      .addCase(updateProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; state.successMsg = 'Profile updated successfully.'; })
      .addCase(updateProfile.rejected, setError)
      
      // Team
      .addCase(fetchTeam.pending, setPending)
      .addCase(fetchTeam.fulfilled, (state, action) => { state.loading = false; state.team = action.payload; })
      .addCase(fetchTeam.rejected, setError)
      .addCase(inviteMember.pending, setPending)
      .addCase(inviteMember.fulfilled, (state, action) => { state.loading = false; state.team.unshift(action.payload); state.successMsg = `Member invited successfully. Temp Password: ${action.payload.tempPassword}`; })
      .addCase(inviteMember.rejected, setError)
      .addCase(updateRole.pending, setPending)
      .addCase(updateRole.fulfilled, (state, action) => { 
        state.loading = false; 
        const index = state.team.findIndex(m => m._id === action.payload._id);
        if (index !== -1) state.team[index] = action.payload;
        state.successMsg = 'Role updated.';
      })
      .addCase(updateRole.rejected, setError)
      .addCase(removeMember.pending, setPending)
      .addCase(removeMember.fulfilled, (state, action) => { state.loading = false; state.team = state.team.filter(m => m._id !== action.payload); state.successMsg = 'Member removed.'; })
      .addCase(removeMember.rejected, setError)

      // Org
      .addCase(fetchOrgSettings.pending, setPending)
      .addCase(fetchOrgSettings.fulfilled, (state, action) => { state.loading = false; state.org = action.payload; })
      .addCase(fetchOrgSettings.rejected, setError)
      .addCase(updateOrgSettings.pending, setPending)
      .addCase(updateOrgSettings.fulfilled, (state, action) => { state.loading = false; state.org = action.payload; state.successMsg = 'Organization settings updated.'; })
      .addCase(updateOrgSettings.rejected, setError);
  },
});

export const { clearSettingsMessages } = settingsSlice.actions;
export default settingsSlice.reducer;
