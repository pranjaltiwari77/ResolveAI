import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ticketReducer from '../features/tickets/ticketSlice';
import articleReducer from '../features/articles/articleSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import kbReducer from '../features/knowledgeBases/kbSlice';
import chatReducer from '../features/chat/chatSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import settingsReducer from '../features/settings/settingsSlice';
import aiConfigReducer from '../features/settings/aiConfigSlice';

const appReducer = combineReducers({
  auth: authReducer,
  tickets: ticketReducer,
  articles: articleReducer,
  dashboard: dashboardReducer,
  kb: kbReducer,
  chat: chatReducer,
  analytics: analyticsReducer,
  settings: settingsReducer,
  aiConfig: aiConfigReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // Clear all state to prevent cross-account data leaks when switching users
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export default store;
