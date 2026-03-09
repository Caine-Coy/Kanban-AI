import { Router } from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
} from '../database/tickets.js';
import { AgentService } from '../services/agent.js';
import type { CreateTicketRequest, UpdateTicketRequest } from 'shared';

export const ticketsRouter = Router();

/**
 * GET /api/tickets
 * Get all tickets (optionally filtered by project)
 */
ticketsRouter.get('/', (req, res) => {
  try {
    const { projectId } = req.query;
    const tickets = getAllTickets(projectId as string | undefined);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/**
 * GET /api/tickets/:id
 * Get a specific ticket
 */
ticketsRouter.get('/:id', (req, res) => {
  try {
    const ticket = getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

/**
 * POST /api/tickets
 * Create a new ticket
 */
ticketsRouter.post('/', (req, res) => {
  try {
    const { title, description, requirements }: CreateTicketRequest = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const ticket = createTicket({ title, description, requirements });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * PUT /api/tickets/:id
 * Update a ticket
 */
ticketsRouter.put('/:id', (req, res) => {
  try {
    const { title, description, status, requirements }: UpdateTicketRequest = req.body;
    const ticket = updateTicket(req.params.id, { title, description, status, requirements });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/**
 * DELETE /api/tickets/:id
 * Delete a ticket
 */
ticketsRouter.delete('/:id', (req, res) => {
  try {
    const deleted = deleteTicket(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

/**
 * POST /api/tickets/:id/assign
 * Assign ticket to an agent (triggered when moved to TODO)
 */
ticketsRouter.post('/:id/assign', async (req, res) => {
  try {
    const ticket = getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const task = await AgentService.assignTicketToAgent(req.params.id);
    
    if (!task) {
      return res.status(200).json({ message: 'No agent available or task already exists' });
    }

    res.status(201).json({ task, ticket });
  } catch (error) {
    console.error('Failed to assign ticket:', error);
    res.status(500).json({ error: 'Failed to assign ticket to agent' });
  }
});
