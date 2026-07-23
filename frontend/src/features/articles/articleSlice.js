import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchArticles = createAsyncThunk('articles/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/articles');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch articles');
  }
});

export const createArticle = createAsyncThunk('articles/create', async (articleData, { rejectWithValue }) => {
  try {
    const response = await api.post('/articles', articleData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create article');
  }
});

export const generateArticle = createAsyncThunk('articles/generate', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post('/articles/generate', payload);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate article');
  }
});

export const updateArticle = createAsyncThunk('articles/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/articles/${id}`, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update article');
  }
});

export const deleteArticle = createAsyncThunk('articles/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/articles/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete article');
  }
});

const articleSlice = createSlice({
  name: 'articles',
  initialState: {
    items: [],
    loading: false,
    error: null,
    mutateLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchArticles.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createArticle.pending, (state) => { state.mutateLoading = true; })
      .addCase(createArticle.fulfilled, (state, action) => {
        state.mutateLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createArticle.rejected, (state, action) => {
        state.mutateLoading = false;
        state.error = action.payload;
      })
      // Generate
      .addCase(generateArticle.pending, (state) => { state.mutateLoading = true; })
      .addCase(generateArticle.fulfilled, (state, action) => {
        state.mutateLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(generateArticle.rejected, (state, action) => {
        state.mutateLoading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateArticle.pending, (state) => { state.mutateLoading = true; })
      .addCase(updateArticle.fulfilled, (state, action) => {
        state.mutateLoading = false;
        const idx = state.items.findIndex(a => a.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateArticle.rejected, (state, action) => {
        state.mutateLoading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.items = state.items.filter(a => a.id !== action.payload);
      });
  },
});

export default articleSlice.reducer;
