import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import KnowledgeBase from './pages/KnowledgeBase';
import DataSources from './pages/DataSources';
import CustomerChat from './pages/CustomerChat';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PromptManagement from './pages/PromptManagement';
import AIEvaluation from './pages/AIEvaluation';
import TicketDetail from './pages/TicketDetail';
import HelpCenter from './pages/HelpCenter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/chat" element={<CustomerChat />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/prompts" element={<PromptManagement />} />
            <Route path="/evaluations" element={<AIEvaluation />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
