import { getDatabase } from './index.js';
import type { Ticket, TicketStatus } from 'shared';

export interface CreateTicketData {
  title: string;
  description: string;
  requirements?: string;
  status?: TicketStatus;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  assignee?: string;
  branch?: string;
  requirements?: string;
  testCommand?: string;
  testTimeout?: number;
}

export function createTicket(data: CreateTicketData): Ticket {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO tickets (id, title, description, status, requirements, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.title, data.description, data.status || 'BACKLOG', data.requirements || null, now, now);

  return {
    id,
    title: data.title,
    description: data.description,
    status: data.status || 'BACKLOG',
    requirements: data.requirements || undefined,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export function getTicketById(id: string): Ticket | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return mapRowToTicket(row);
}

export function getAllTickets(): Ticket[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC');
  const rows = stmt.all() as any[];

  return rows.map(mapRowToTicket);
}

export function getTicketsByStatus(status: TicketStatus): Ticket[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tickets WHERE status = ? ORDER BY createdAt DESC');
  const rows = stmt.all(status) as any[];

  return rows.map(mapRowToTicket);
}

export function updateTicket(id: string, data: UpdateTicketData): Ticket | undefined {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.assignee !== undefined) {
    fields.push('assignee = ?');
    values.push(data.assignee);
  }
  if (data.branch !== undefined) {
    fields.push('branch = ?');
    values.push(data.branch);
  }
  if (data.requirements !== undefined) {
    fields.push('requirements = ?');
    values.push(data.requirements);
  }
  if (data.testCommand !== undefined) {
    fields.push('testCommand = ?');
    values.push(data.testCommand);
  }
  if (data.testTimeout !== undefined) {
    fields.push('testTimeout = ?');
    values.push(data.testTimeout);
  }

  if (fields.length === 0) {
    return getTicketById(id);
  }

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`
    UPDATE tickets SET ${fields.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getTicketById(id);
}

export function deleteTicket(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

function mapRowToTicket(row: any): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TicketStatus,
    assignee: row.assignee || undefined,
    branch: row.branch || undefined,
    requirements: row.requirements || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
