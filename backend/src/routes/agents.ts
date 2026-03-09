import { Router } from 'express';
import {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
} from '../database/agents.js';
import type { CreateAgentRequest } from 'shared';

export const agentsRouter = Router();

/**
 * GET /api/agents
 * Get all agents
 */
agentsRouter.get('/', (_req, res) => {
  try {
    const agents = getAllAgents();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * GET /api/agents/:id
 * Get a specific agent
 */
agentsRouter.get('/:id', (req, res) => {
  try {
    const agent = getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

/**
 * POST /api/agents
 * Create a new agent
 */
agentsRouter.post('/', (req, res) => {
  try {
    const { name }: CreateAgentRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const agent = createAgent({ name });
    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

/**
 * PUT /api/agents/:id
 * Update an agent
 */
agentsRouter.put('/:id', (req, res) => {
  try {
    const { name, status, currentTicketId } = req.body;
    const agent = updateAgent(req.params.id, { name, status, currentTicketId });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
agentsRouter.delete('/:id', (req, res) => {
  try {
    const deleted = deleteAgent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});
