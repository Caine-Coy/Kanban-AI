import { expect, test, describe } from 'vitest';
import { setupDatabase } from '../database/index.js';
import { createTicket, getAllTickets, getTicketById, updateTicket } from '../database/tickets.js';

describe('Ticket Database', () => {
  test('should create a ticket', () => {
    setupDatabase();
    
    const ticket = createTicket({
      title: 'Test Ticket',
      description: 'Test Description',
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.title).toBe('Test Ticket');
    expect(ticket.status).toBe('BACKLOG');
  });

  test('should get all tickets', () => {
    const tickets = getAllTickets();
    expect(Array.isArray(tickets)).toBe(true);
  });

  test('should get ticket by id', () => {
    const ticket = createTicket({
      title: 'Get By ID Test',
      description: 'Test',
    });

    const found = getTicketById(ticket.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Get By ID Test');
  });

  test('should update ticket', () => {
    const ticket = createTicket({
      title: 'Update Test',
      description: 'Original',
    });

    const updated = updateTicket(ticket.id, {
      title: 'Updated Title',
      description: 'Updated Description',
    });

    expect(updated?.title).toBe('Updated Title');
    expect(updated?.description).toBe('Updated Description');
  });
});
