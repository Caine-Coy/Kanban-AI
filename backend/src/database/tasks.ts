import { getDatabase } from './index.js';
import type { AgentTask, TaskStatus } from 'shared';

export interface CreateTaskData {
  ticketId: string;
  branch: string;
  agentId?: string;
}

export interface UpdateTaskData {
  agentId?: string;
  status?: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs?: string[];
}

export function createTask(data: CreateTaskData): AgentTask {
  const db = getDatabase();
  const id = crypto.randomUUID();

  const stmt = db.prepare(`
    INSERT INTO tasks (id, ticketId, agentId, status, branch, logs)
    VALUES (?, ?, ?, 'PENDING', ?, '[]')
  `);

  stmt.run(id, data.ticketId, data.agentId || null, data.branch);

  return {
    id,
    ticketId: data.ticketId,
    agentId: data.agentId,
    status: 'PENDING',
    branch: data.branch,
    logs: [],
  };
}

export function getTaskById(id: string): AgentTask | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return mapRowToTask(row);
}

export function getTaskByTicketId(ticketId: string): AgentTask | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE ticketId = ? ORDER BY createdAt DESC LIMIT 1');
  const row = stmt.get(ticketId) as any;

  if (!row) return undefined;

  return mapRowToTask(row);
}

export function getAllTasks(): AgentTask[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC');
  const rows = stmt.all() as any[];

  return rows.map(mapRowToTask);
}

export function getActiveTasks(): AgentTask[] {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM tasks WHERE status IN ('PENDING', 'RUNNING')");
  const rows = stmt.all() as any[];

  return rows.map(mapRowToTask);
}

export function updateTask(id: string, data: UpdateTaskData): AgentTask | undefined {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.agentId !== undefined) {
    fields.push('agentId = ?');
    values.push(data.agentId);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.startedAt !== undefined) {
    fields.push('startedAt = ?');
    values.push(data.startedAt.toISOString());
  }
  if (data.completedAt !== undefined) {
    fields.push('completedAt = ?');
    values.push(data.completedAt.toISOString());
  }
  if (data.error !== undefined) {
    fields.push('error = ?');
    values.push(data.error);
  }
  if (data.logs !== undefined) {
    fields.push('logs = ?');
    values.push(JSON.stringify(data.logs));
  }

  if (fields.length === 0) {
    return getTaskById(id);
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE tasks SET ${fields.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getTaskById(id);
}

export function deleteTask(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

function mapRowToTask(row: any): AgentTask {
  return {
    id: row.id,
    ticketId: row.ticketId,
    agentId: row.agentId || undefined,
    status: row.status as TaskStatus,
    branch: row.branch,
    startedAt: row.startedAt ? new Date(row.startedAt) : undefined,
    completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    error: row.error || undefined,
    logs: row.logs ? JSON.parse(row.logs) : [],
  };
}
