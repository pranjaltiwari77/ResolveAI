import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchKnowledgeBases = createAsyncThunk('kb/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/knowledge-bases');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch knowledge bases');
  }
});

export const createKnowledgeBase = createAsyncThunk('kb/create', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/knowledge-bases', data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create knowledge base');
  }
});

export const fetchDocuments = createAsyncThunk('kb/fetchDocuments', async (kbId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/knowledge-bases/${kbId}/documents`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch documents');
  }
});

export const uploadDocument = createAsyncThunk('kb/uploadDocument', async ({ kbId, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/knowledge-bases/${kbId}/documents`, formData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to upload document');
  }
});

export const deleteDocument = createAsyncThunk('kb/deleteDocument', async ({ kbId, docId }, { rejectWithValue }) => {
  try {
    await api.delete(`/knowledge-bases/${kbId}/documents/${docId}`);
    return docId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete document');
  }
});

const kbSlice = createSlice({
  name: 'kb',
  initialState: {
    knowledgeBases: [],
    documents: [],
    loading: false,
    docLoading: false,
    error: null,
    uploadLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch KBs
      .addCase(fetchKnowledgeBases.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchKnowledgeBases.fulfilled, (state, action) => {
        state.loading = false;
        state.knowledgeBases = action.payload;
      })
      .addCase(fetchKnowledgeBases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create KB
      .addCase(createKnowledgeBase.fulfilled, (state, action) => {
        state.knowledgeBases.unshift(action.payload);
      })
      // Fetch Docs
      .addCase(fetchDocuments.pending, (state) => { state.docLoading = true; })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.docLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state) => {
        state.docLoading = false;
      })
      // Upload Doc
      .addCase(uploadDocument.pending, (state) => { state.uploadLoading = true; })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.documents.unshift(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      })
      // Delete Doc
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d.id !== action.payload);
      });
  },
});

export default kbSlice.reducer;
