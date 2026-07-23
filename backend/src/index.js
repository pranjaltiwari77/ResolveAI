require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { initSockets } = require('./services/socketService');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const articleRoutes = require('./routes/articleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const promptRoutes = require('./routes/promptRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const actionRoutes = require('./routes/actionRoutes');
const { startSLAWorker } = require('./workers/slaWorker');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSockets(server);

// Allow any origin dynamically so the Vercel frontend can connect
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'ResolveAI API is running successfully!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/knowledge-bases', knowledgeBaseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/actions', actionRoutes);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Start server immediately so CORS works even before DB connects
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startSLAWorker(); // Start background SLA check after DB is ready
  })
  .catch((err) => console.error('Failed to connect to MongoDB', err));
