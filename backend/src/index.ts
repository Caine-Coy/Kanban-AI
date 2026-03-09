import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { setupDatabase } from './database/index.js';
import { setupRoutes } from './routes/index.js';
import { setupWebSocket } from './websocket/index.js';
import { AgentService } from './services/agent.js';
import { getIdleAgents, createAgent } from './database/agents.js';

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
setupDatabase();

// Create default agent if none exist
const idleAgents = getIdleAgents();
if (idleAgents.length === 0) {
  createAgent({ name: 'Kanban-Worker-1' });
  console.log('🤖 Default agent created: Kanban-Worker-1');
}

// Setup REST API routes
setupRoutes(app);

// Setup WebSocket for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

setupWebSocket(io);

// Initialize agent service
AgentService.initialize(io);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
