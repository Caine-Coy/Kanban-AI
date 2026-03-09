import { Router } from 'express';
import { ticketsRouter } from './tickets.js';
import { agentsRouter } from './agents.js';
import { settingsRouter } from './settings.js';
import { tasksRouter } from './tasks.js';

export function setupRoutes(app: Router): void {
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/agents', agentsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/tasks', tasksRouter);
}
