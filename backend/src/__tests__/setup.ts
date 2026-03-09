import 'dotenv/config';
import { AgentService } from '../services/agent.js';

// Mock Socket.IO server for tests
const mockIO = {
  emit: () => {},
  to: () => ({
    emit: () => {},
  }),
  in: () => ({
    emit: () => {},
  }),
  on: () => {},
  off: () => {},
} as any;

// Initialize AgentService with mock Socket.IO server
AgentService.initialize(mockIO);
