import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchPrompts = createAsyncThunk('aiConfig/fetchPrompts', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/ai-config/prompts');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch prompts');
  }
});

export const updatePrompt = createAsyncThunk('aiConfig/updatePrompt', async ({ type, instruction }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/ai-config/prompts/${type}`, { instruction });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update prompt');
  }
});

export const fetchUsage = createAsyncThunk('aiConfig/fetchUsage', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/ai-config/usage');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch AI usage');
  }
});

export const fetchEvaluation = createAsyncThunk('aiConfig/fetchEvaluation', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/ai-config/evaluation');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch AI evaluation');
  }
});

const aiConfigSlice = createSlice({
  name: 'aiConfig',
  initialState: {
    prompts: [],
    usage: [],
    evaluation: null,
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearAiConfigMessages: (state) => {
      state.error = null;
      state.successMsg = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Prompts
      .addCase(fetchPrompts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPrompts.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts = action.payload;
      })
      .addCase(fetchPrompts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Prompt
      .addCase(updatePrompt.pending, (state) => { state.loading = true; state.error = null; state.successMsg = null; })
      .addCase(updatePrompt.fulfilled, (state, action) => {
        state.loading = false;
        state.successMsg = 'Prompt updated successfully!';
        const index = state.prompts.findIndex(p => p.type === action.payload.type);
        if (index !== -1) {
          state.prompts[index] = action.payload;
        } else {
          state.prompts.push(action.payload);
        }
      })
      .addCase(updatePrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Usage
      .addCase(fetchUsage.pending, (state) => { state.loading = true; })
      .addCase(fetchUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.usage = action.payload;
      })
      .addCase(fetchUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Evaluation
      .addCase(fetchEvaluation.pending, (state) => { state.loading = true; })
      .addCase(fetchEvaluation.fulfilled, (state, action) => {
        state.loading = false;
        state.evaluation = action.payload;
      })
      .addCase(fetchEvaluation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAiConfigMessages } = aiConfigSlice.actions;
export default aiConfigSlice.reducer;
