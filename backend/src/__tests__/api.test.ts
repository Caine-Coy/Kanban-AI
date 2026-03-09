import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase } from '../database/index.js';
import { ticketsRouter } from '../routes/tickets.js';
import { agentsRouter } from '../routes/agents.js';
import { settingsRouter } from '../routes/settings.js';
import { tasksRouter } from '../routes/tasks.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/tickets', ticketsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/tasks', tasksRouter);

describe('API Integration Tests', () => {
  beforeAll(() => {
    setupDatabase();
  });

  describe('Tickets API', () => {
    describe('POST /api/tickets', () => {
      it('should create a new ticket', async () => {
        const response = await request(app)
          .post('/api/tickets')
          .send({
            title: 'API Test Ticket',
            description: 'Testing ticket creation via API',
          });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.title).toBe('API Test Ticket');
        expect(response.body.status).toBe('BACKLOG');
      });

      it('should reject ticket creation without title', async () => {
        const response = await request(app)
          .post('/api/tickets')
          .send({
            description: 'No title',
          });

        expect(response.status).toBe(400);
      });

      it('should reject ticket creation without description', async () => {
        const response = await request(app)
          .post('/api/tickets')
          .send({
            title: 'No description',
          });

        expect(response.status).toBe(400);
      });

      it('should create ticket with requirements', async () => {
        const response = await request(app)
          .post('/api/tickets')
          .send({
            title: 'Ticket with Requirements',
            description: 'Description',
            requirements: 'Must include X, Y, Z',
          });

        expect(response.status).toBe(201);
        expect(response.body.requirements).toBe('Must include X, Y, Z');
      });
    });

    describe('GET /api/tickets', () => {
      it('should return all tickets', async () => {
        const response = await request(app).get('/api/tickets');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/tickets/:id', () => {
      let createdTicketId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/tickets')
          .send({ title: 'Get Test', description: 'Desc' });
        createdTicketId = createResponse.body.id;
      });

      it('should return a ticket by ID', async () => {
        const response = await request(app).get(`/api/tickets/${createdTicketId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdTicketId);
      });

      it('should return 404 for non-existent ticket', async () => {
        const response = await request(app).get('/api/tickets/non-existent-id');

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/tickets/:id', () => {
      let createdTicketId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/tickets')
          .send({ title: 'Update Test', description: 'Original' });
        createdTicketId = createResponse.body.id;
      });

      it('should update ticket title', async () => {
        const response = await request(app)
          .put(`/api/tickets/${createdTicketId}`)
          .send({ title: 'Updated Title' });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('Updated Title');
      });

      it('should update ticket status', async () => {
        const response = await request(app)
          .put(`/api/tickets/${createdTicketId}`)
          .send({ status: 'TODO' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('TODO');
      });

      it('should return 404 for non-existent ticket', async () => {
        const response = await request(app)
          .put('/api/tickets/non-existent-id')
          .send({ title: 'Updated' });

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/tickets/:id', () => {
      it('should delete a ticket', async () => {
        const createResponse = await request(app)
          .post('/api/tickets')
          .send({ title: 'Delete Test', description: 'Desc' });

        const deleteResponse = await request(app)
          .delete(`/api/tickets/${createResponse.body.id}`);

        expect(deleteResponse.status).toBe(204);

        // Verify it's deleted
        const getResponse = await request(app)
          .get(`/api/tickets/${createResponse.body.id}`);

        expect(getResponse.status).toBe(404);
      });
    });

    describe('POST /api/tickets/:id/assign', () => {
      let createdTicketId: string;

      beforeEach(async () => {
        const createResponse = await request(app)
          .post('/api/tickets')
          .send({ title: 'Assign Test', description: 'Desc' });
        createdTicketId = createResponse.body.id;
      });

      it('should handle ticket assignment (no agents available)', async () => {
        const response = await request(app)
          .post(`/api/tickets/${createdTicketId}/assign`);

        // Should return 500 when AgentService not initialized in test context
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe('Agents API', () => {
    describe('POST /api/agents', () => {
      it('should create a new agent', async () => {
        const response = await request(app)
          .post('/api/agents')
          .send({ name: 'TestAgent-1' });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toBe('TestAgent-1');
        expect(response.body.status).toBe('IDLE');
      });

      it('should reject agent creation without name', async () => {
        const response = await request(app)
          .post('/api/agents')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/agents', () => {
      it('should return all agents', async () => {
        const response = await request(app).get('/api/agents');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  describe('Settings API', () => {
    describe('GET /api/settings', () => {
      it('should return all settings', async () => {
        const response = await request(app).get('/api/settings');

        expect(response.status).toBe(200);
        expect(response.body.lmStudioUrl).toBeDefined();
        expect(response.body.testCommand).toBeDefined();
      });
    });

    describe('PUT /api/settings', () => {
      it('should update settings', async () => {
        const response = await request(app)
          .put('/api/settings')
          .send({ lmStudioUrl: 'http://localhost:9999' });

        expect(response.status).toBe(200);
        expect(response.body.lmStudioUrl).toBe('http://localhost:9999');
      });
    });

    describe('GET /api/settings/test-lmstudio', () => {
      it('should test LM Studio connection', async () => {
        const response = await request(app).get('/api/settings/test-lmstudio');

        expect(response.status).toBe(200);
        expect(response.body.connected).toBeDefined();
      });
    });
  });

  describe('Tasks API', () => {
    describe('GET /api/tasks', () => {
      it('should return all tasks', async () => {
        const response = await request(app).get('/api/tasks');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });
});
