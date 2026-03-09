import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupDatabase } from '../database/index.js';
import { 
  createTicket, 
  getAllTickets, 
  getTicketById, 
  updateTicket, 
  deleteTicket,
  getTicketsByStatus 
} from '../database/tickets.js';
import type { TicketStatus } from 'shared';

describe('Ticket Database Operations', () => {
  beforeEach(() => {
    setupDatabase();
  });

  describe('createTicket', () => {
    it('should create a ticket with required fields', () => {
      const ticket = createTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.id).toHaveLength(36); // UUID length
      expect(ticket.title).toBe('Test Ticket');
      expect(ticket.description).toBe('Test Description');
      expect(ticket.status).toBe('BACKLOG');
      expect(ticket.createdAt).toBeDefined();
      expect(ticket.updatedAt).toBeDefined();
    });

    it('should create a ticket with requirements', () => {
      const ticket = createTicket({
        title: 'Ticket with Requirements',
        description: 'Description',
        requirements: 'Must do X, Y, Z',
      });

      expect(ticket.requirements).toBe('Must do X, Y, Z');
    });

    it('should create a ticket with custom status', () => {
      const ticket = createTicket({
        title: 'TODO Ticket',
        description: 'Description',
        status: 'TODO',
      });

      expect(ticket.status).toBe('TODO');
    });

    it('should create multiple tickets with unique IDs', () => {
      const ticket1 = createTicket({ title: 'Ticket 1', description: 'Desc 1' });
      const ticket2 = createTicket({ title: 'Ticket 2', description: 'Desc 2' });

      expect(ticket1.id).not.toBe(ticket2.id);
    });
  });

  describe('getTicketById', () => {
    it('should retrieve a ticket by ID', () => {
      const created = createTicket({ title: 'Get Test', description: 'Description' });
      const retrieved = getTicketById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Get Test');
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent ticket', () => {
      const ticket = getTicketById('non-existent-id');
      expect(ticket).toBeUndefined();
    });
  });

  describe('getAllTickets', () => {
    it('should return all tickets', () => {
      // Create a few tickets
      createTicket({ title: 'Ticket A', description: 'Desc' });
      createTicket({ title: 'Ticket B', description: 'Desc' });
      createTicket({ title: 'Ticket C', description: 'Desc' });

      const tickets = getAllTickets();
      expect(tickets.length).toBeGreaterThanOrEqual(3);
    });

    it('should return tickets ordered by creation date', () => {
      const tickets = getAllTickets();
      
      if (tickets.length >= 2) {
        expect(tickets[0].createdAt >= tickets[1].createdAt).toBe(true);
      }
    });
  });

  describe('getTicketsByStatus', () => {
    it('should return tickets filtered by status', () => {
      const backlogTicket = createTicket({ title: 'Backlog Ticket', description: 'Desc' });
      const todoTicket = createTicket({ 
        title: 'TODO Ticket', 
        description: 'Desc',
        status: 'TODO' 
      });

      const backlogTickets = getTicketsByStatus('BACKLOG');
      const todoTickets = getTicketsByStatus('TODO');

      expect(backlogTickets.some(t => t.id === backlogTicket.id)).toBe(true);
      expect(todoTickets.some(t => t.id === todoTicket.id)).toBe(true);
      expect(backlogTickets.every(t => t.status === 'BACKLOG')).toBe(true);
      expect(todoTickets.every(t => t.status === 'TODO')).toBe(true);
    });
  });

  describe('updateTicket', () => {
    it('should update ticket title', () => {
      const ticket = createTicket({ title: 'Original', description: 'Desc' });
      const updated = updateTicket(ticket.id, { title: 'Updated' });

      expect(updated?.title).toBe('Updated');
      expect(updated?.description).toBe('Desc');
    });

    it('should update ticket description', () => {
      const ticket = createTicket({ title: 'Title', description: 'Original' });
      const updated = updateTicket(ticket.id, { description: 'Updated' });

      expect(updated?.description).toBe('Updated');
    });

    it('should update ticket status', () => {
      const ticket = createTicket({ title: 'Title', description: 'Desc' });
      const updated = updateTicket(ticket.id, { status: 'IN_PROGRESS' });

      expect(updated?.status).toBe('IN_PROGRESS');
    });

    it('should update multiple fields at once', () => {
      const ticket = createTicket({ title: 'Title', description: 'Desc' });
      const updated = updateTicket(ticket.id, { 
        title: 'New Title',
        description: 'New Desc',
        status: 'REVIEW',
      });

      expect(updated?.title).toBe('New Title');
      expect(updated?.description).toBe('New Desc');
      expect(updated?.status).toBe('REVIEW');
    });

    it('should return undefined for non-existent ticket', () => {
      const updated = updateTicket('non-existent-id', { title: 'Updated' });
      expect(updated).toBeUndefined();
    });

    it('should update updatedAt timestamp', () => {
      const ticket = createTicket({ title: 'Title', description: 'Desc' });
      
      // Wait a small amount to ensure different timestamp
      const beforeUpdate = ticket.updatedAt;
      
      // Update the ticket
      updateTicket(ticket.id, { title: 'Updated' });
      
      const refreshed = getTicketById(ticket.id);
      expect(refreshed?.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket', () => {
      const ticket = createTicket({ title: 'To Delete', description: 'Desc' });
      
      const deleted = deleteTicket(ticket.id);
      expect(deleted).toBe(true);
      
      const retrieved = getTicketById(ticket.id);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent ticket', () => {
      const deleted = deleteTicket('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should not affect other tickets when deleting', () => {
      const ticket1 = createTicket({ title: 'Keep', description: 'Desc' });
      const ticket2 = createTicket({ title: 'Delete', description: 'Desc' });

      deleteTicket(ticket2.id);

      const remaining = getTicketById(ticket1.id);
      expect(remaining).toBeDefined();
      expect(remaining?.title).toBe('Keep');
    });
  });
});
