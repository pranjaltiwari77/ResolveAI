import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/chat/conversations');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch conversations');
  }
});

export const createConversation = createAsyncThunk('chat/createConversation', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/chat/conversations', data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create conversation');
  }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch messages');
  }
});

export const rateMessage = createAsyncThunk('chat/rateMessage', async ({ messageId, feedback }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/chat/messages/${messageId}/rate`, { feedback });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to rate message');
  }
});

export const escalateConversation = createAsyncThunk('chat/escalateConversation', async (conversationId, { rejectWithValue }) => {
  try {
    const response = await api.post(`/chat/conversations/${conversationId}/escalate`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to escalate conversation');
  }
});

export const approveAction = createAsyncThunk('chat/approveAction', async (actionId, { rejectWithValue }) => {
  try {
    const response = await api.post(`/actions/${actionId}/approve`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to approve action');
  }
});

export const rejectAction = createAsyncThunk('chat/rejectAction', async (actionId, { rejectWithValue }) => {
  try {
    const response = await api.post(`/actions/${actionId}/reject`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to reject action');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    messages: [],
    loading: false,
    msgLoading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action) => {
      // Used for streaming updates
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content += action.payload;
      }
    },
    setLastMessageComplete: (state, action) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.id = action.payload.messageId;
        lastMsg.citations = action.payload.citations;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.loading = true; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
      })
      .addCase(fetchMessages.pending, (state) => { state.msgLoading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.msgLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.msgLoading = false;
        state.error = action.payload;
      })
      // Rate message
      .addCase(rateMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      });
  },
});

export const { addMessage, updateLastMessage, setLastMessageComplete } = chatSlice.actions;
export default chatSlice.reducer;
