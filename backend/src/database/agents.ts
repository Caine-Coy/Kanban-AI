import { getDatabase } from './index.js';
import type { Agent, AgentStatus } from 'shared';

export interface CreateAgentData {
  name: string;
}

export function createAgent(data: CreateAgentData): Agent {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO agents (id, name, status, lastActive)
    VALUES (?, ?, 'IDLE', ?)
  `);

  stmt.run(id, data.name, now);

  return {
    id,
    name: data.name,
    status: 'IDLE',
    lastActive: new Date(now),
  };
}

export function getAgentById(id: string): Agent | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return mapRowToAgent(row);
}

export function getAllAgents(): Agent[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agents ORDER BY lastActive DESC');
  const rows = stmt.all() as any[];

  return rows.map(mapRowToAgent);
}

export function getIdleAgents(): Agent[] {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM agents WHERE status = 'IDLE'");
  const rows = stmt.all() as any[];

  return rows.map(mapRowToAgent);
}

export function updateAgent(id: string, data: { name?: string; status?: AgentStatus; currentTicketId?: string }): Agent | undefined {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = ['lastActive = ?'];
  const values: any[] = [now];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.currentTicketId !== undefined) {
    fields.push('currentTicketId = ?');
    values.push(data.currentTicketId);
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE agents SET ${fields.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getAgentById(id);
}

export function deleteAgent(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

function mapRowToAgent(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    status: row.status as AgentStatus,
    currentTicketId: row.currentTicketId || undefined,
    lastActive: new Date(row.lastActive),
  };
}
