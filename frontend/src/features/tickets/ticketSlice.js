import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchTickets = createAsyncThunk('tickets/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/tickets');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch tickets');
  }
});

export const fetchTicketById = createAsyncThunk('tickets/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch ticket');
  }
});

export const createTicket = createAsyncThunk('tickets/create', async (ticketData, { rejectWithValue }) => {
  try {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create ticket');
  }
});

export const deflectTicket = createAsyncThunk('tickets/deflect', async (ticketData, { rejectWithValue }) => {
  try {
    const response = await api.post('/tickets/deflect', ticketData);
    return response.data; // { deflected: boolean, solution?: string }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to check for deflection');
  }
});

export const updateTicket = createAsyncThunk('tickets/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update ticket');
  }
});

export const addComment = createAsyncThunk('tickets/addComment', async ({ id, content, isPublic, attachmentUrl, attachmentType }, { rejectWithValue }) => {
  try {
    const response = await api.post(`/tickets/${id}/comments`, { content, isPublic, attachmentUrl, attachmentType });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add comment');
  }
});

export const generateDraftReply = createAsyncThunk('tickets/generateDraftReply', async (id, { rejectWithValue }) => {
  try {
    const response = await api.post(`/tickets/${id}/draft-reply`);
    return response.data.draft;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate draft');
  }
});

export const deleteTicket = createAsyncThunk('tickets/delete', async (id, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/tickets/${id}`);
    return id; // return the id of the deleted ticket
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete ticket');
  }
});

const ticketSlice = createSlice({
  name: 'tickets',
  initialState: {
    items: [],
    loading: false,
    error: null,
    createLoading: false,
    deflectLoading: false,
    deflectionResult: null,
    draftReply: null,
    draftLoading: false,
  },
  reducers: {
    clearDraftReply: (state) => {
      state.draftReply = null;
    },
    clearDeflectionResult: (state) => {
      state.deflectionResult = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Ticket
      .addCase(createTicket.pending, (state) => { state.createLoading = true; })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.createLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Deflect Ticket
      .addCase(deflectTicket.pending, (state) => { state.deflectLoading = true; state.deflectionResult = null; })
      .addCase(deflectTicket.fulfilled, (state, action) => {
        state.deflectLoading = false;
        state.deflectionResult = action.payload; // { deflected: true, solution: '...' } or { deflected: false }
      })
      .addCase(deflectTicket.rejected, (state) => {
        state.deflectLoading = false;
        // On error, just pretend it wasn't deflected to unblock user
        state.deflectionResult = { deflected: false };
      })
      // Update Ticket
      .addCase(updateTicket.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Fetch By Id (update single item in list)
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Generate Draft Reply
      .addCase(generateDraftReply.pending, (state) => { state.draftLoading = true; state.error = null; })
      .addCase(generateDraftReply.fulfilled, (state, action) => {
        state.draftLoading = false;
        state.draftReply = action.payload;
      })
      .addCase(generateDraftReply.rejected, (state, action) => {
        state.draftLoading = false;
        state.error = action.payload;
      })
      // Delete Ticket
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearDraftReply, clearDeflectionResult } = ticketSlice.actions;
export default ticketSlice.reducer;
