import { describe, it, expect, beforeEach } from 'vitest';
import { setupDatabase } from '../database/index.js';
import { createTicket, getTicketById, updateTicket, getAllTickets } from '../database/tickets.js';
import { createAgent, getAgentById, updateAgent, getAllAgents } from '../database/agents.js';
import { createTask, getTaskByTicketId, updateTask } from '../database/tasks.js';

/**
 * Regression Tests
 * 
 * These tests ensure that previously fixed bugs don't resurface.
 * Add tests here when bugs are found and fixed.
 */
describe('Regression Tests', () => {
  beforeEach(() => {
    setupDatabase();
  });

  describe('Bug #001: Ticket creation without status should default to BACKLOG', () => {
    it('should create ticket with BACKLOG status when no status provided', () => {
      const ticket = createTicket({
        title: 'Regression Test Ticket',
        description: 'Testing default status',
      });

      expect(ticket.status).toBe('BACKLOG');
      
      // Verify in database
      const retrieved = getTicketById(ticket.id);
      expect(retrieved?.status).toBe('BACKLOG');
    });
  });

  describe('Bug #002: Agent status should update when assigned a ticket', () => {
    it('should update agent status from IDLE to WORKING when assigned', () => {
      const agent = createAgent({ name: 'RegressionTestAgent' });
      const ticket = createTicket({ title: 'Test', description: 'Desc' });

      expect(agent.status).toBe('IDLE');

      const updated = updateAgent(agent.id, {
        status: 'WORKING',
        currentTicketId: ticket.id,
      });

      expect(updated?.status).toBe('WORKING');
      expect(updated?.currentTicketId).toBe(ticket.id);
    });
  });

  describe('Bug #003: Task should track ticket correctly', () => {
    it('should retrieve task by ticket ID', () => {
      const ticket = createTicket({ title: 'Test', description: 'Desc' });
      const task = createTask({
        ticketId: ticket.id,
        branch: 'ticket/test-branch',
      });

      const retrieved = getTaskByTicketId(ticket.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(task.id);
    });

    it('should return a task for a ticket', () => {
      const ticket = createTicket({ title: 'Test', description: 'Desc' });
      
      createTask({ ticketId: ticket.id, branch: 'branch-1' });
      createTask({ ticketId: ticket.id, branch: 'branch-2' });

      const retrieved = getTaskByTicketId(ticket.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.branch).toBeDefined();
    });
  });

  describe('Bug #004: Ticket update should not modify unrelated fields', () => {
    it('should preserve description when updating only title', () => {
      const ticket = createTicket({
        title: 'Original Title',
        description: 'Original Description',
        requirements: 'Original Requirements',
      });

      updateTicket(ticket.id, { title: 'New Title' });

      const updated = getTicketById(ticket.id);
      expect(updated?.title).toBe('New Title');
      expect(updated?.description).toBe('Original Description');
      expect(updated?.requirements).toBe('Original Requirements');
    });
  });

  describe('Bug #005: Task logs should be properly serialized', () => {
    it('should store and retrieve task logs as array', () => {
      const ticket = createTicket({ title: 'Test', description: 'Desc' });
      const task = createTask({
        ticketId: ticket.id,
        branch: 'test-branch',
      });

      const logs = ['Step 1', 'Step 2', 'Step 3'];
      const updated = updateTask(task.id, { logs });

      expect(updated?.logs).toEqual(logs);
      expect(Array.isArray(updated?.logs)).toBe(true);
    });

    it('should handle empty logs array', () => {
      const ticket = createTicket({ title: 'Test', description: 'Desc' });
      const task = createTask({
        ticketId: ticket.id,
        branch: 'test-branch',
      });

      const updated = updateTask(task.id, { logs: [] });
      expect(updated?.logs).toEqual([]);
    });
  });

  describe('Bug #006: Agent should be releasable after task completion', () => {
    it('should allow agent to be set back to IDLE after working', () => {
      const agent = createAgent({ name: 'TestAgent' });
      const ticket = createTicket({ title: 'Test', description: 'Desc' });

      // Assign ticket to agent
      updateAgent(agent.id, {
        status: 'WORKING',
        currentTicketId: ticket.id,
      });

      // Complete the work and release
      const released = updateAgent(agent.id, {
        status: 'IDLE',
      });

      expect(released?.status).toBe('IDLE');
    });
  });

  describe('Bug #007: Task status transitions should be valid', () => {
    it('should allow PENDING -> RUNNING -> COMPLETED transition', () => {
      const ticket = createTicket({ title: 'Test', description: 'Desc' });
      const task = createTask({ ticketId: ticket.id, branch: 'test' });

      expect(task.status).toBe('PENDING');

      const running = updateTask(task.id, {
        status: 'RUNNING',
        startedAt: new Date(),
      });
      expect(running?.status).toBe('RUNNING');

      const completed = updateTask(task.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
      });
      expect(completed?.status).toBe('COMPLETED');
    });

    it('should allow PENDING -> RUNNING -> FAILED transition', () => {
      const ticket = createTicket({ title: 'Test', description: 'Desc' });
      const task = createTask({ ticketId: ticket.id, branch: 'test' });

      updateTask(task.id, { status: 'RUNNING' });

      const failed = updateTask(task.id, {
        status: 'FAILED',
        error: 'Test error',
        completedAt: new Date(),
      });
      expect(failed?.status).toBe('FAILED');
      expect(failed?.error).toBe('Test error');
    });
  });

  describe('Bug #008: Special characters in ticket data', () => {
    it('should handle special characters in title', () => {
      const ticket = createTicket({
        title: 'Test with "quotes" and \'apostrophes\' & <special> chars',
        description: 'Description',
      });

      expect(ticket.title).toContain('"quotes"');
      expect(ticket.title).toContain('<special>');
    });

    it('should handle newlines in description', () => {
      const ticket = createTicket({
        title: 'Test',
        description: 'Line 1\nLine 2\nLine 3',
      });

      expect(ticket.description).toContain('\n');
    });

    it('should handle unicode characters', () => {
      const ticket = createTicket({
        title: 'Test 你好 🚀',
        description: 'Description with émojis 🎉',
      });

      expect(ticket.title).toContain('你好');
      expect(ticket.title).toContain('🚀');
    });
  });

  describe('Bug #009: Concurrent ticket updates', () => {
    it('should handle rapid sequential updates', () => {
      const ticket = createTicket({ title: 'Original', description: 'Desc' });

      // Simulate rapid updates
      updateTicket(ticket.id, { title: 'Update 1' });
      updateTicket(ticket.id, { title: 'Update 2' });
      updateTicket(ticket.id, { title: 'Update 3' });

      const final = getTicketById(ticket.id);
      expect(final?.title).toBe('Update 3');
    });
  });

  describe('Bug #010: Empty state handling', () => {
    it('should handle getting tickets when none exist', () => {
      // This test ensures the system doesn't crash with empty state
      const tickets = getAllTickets();
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should handle getting agents when none exist', () => {
      const agents = getAllAgents();
      expect(Array.isArray(agents)).toBe(true);
    });
  });
});
