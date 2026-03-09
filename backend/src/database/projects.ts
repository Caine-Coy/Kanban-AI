import { getDatabase } from './index.js';
import type { Project } from 'shared';

export interface CreateProjectData {
  name: string;
  description?: string;
  folderPath?: string;
  gitRemote: string;
  githubOwner?: string;
  githubRepo?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  folderPath?: string;
  gitRemote?: string;
  githubOwner?: string;
  githubRepo?: string;
}

export function createProject(data: CreateProjectData): Project {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, folderPath, gitRemote, githubOwner, githubRepo, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.name, data.description || null, data.folderPath || null, data.gitRemote, data.githubOwner || null, data.githubRepo || null, now, now);

  return {
    id,
    name: data.name,
    description: data.description || undefined,
    folderPath: data.folderPath || undefined,
    gitRemote: data.gitRemote,
    githubOwner: data.githubOwner || undefined,
    githubRepo: data.githubRepo || undefined,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export function getProjectById(id: string): Project | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return mapRowToProject(row);
}

export function getAllProjects(): Project[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM projects ORDER BY createdAt DESC');
  const rows = stmt.all() as any[];

  return rows.map(mapRowToProject);
}

export function updateProject(id: string, data: UpdateProjectData): Project | undefined {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.folderPath !== undefined) {
    fields.push('folderPath = ?');
    values.push(data.folderPath);
  }
  if (data.gitRemote !== undefined) {
    fields.push('gitRemote = ?');
    values.push(data.gitRemote);
  }
  if (data.githubOwner !== undefined) {
    fields.push('githubOwner = ?');
    values.push(data.githubOwner);
  }
  if (data.githubRepo !== undefined) {
    fields.push('githubRepo = ?');
    values.push(data.githubRepo);
  }

  if (fields.length === 0) {
    return getProjectById(id);
  }

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`
    UPDATE projects SET ${fields.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getProjectById(id);
}

export function deleteProject(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    folderPath: row.folderPath || undefined,
    gitRemote: row.gitRemote,
    githubOwner: row.githubOwner || undefined,
    githubRepo: row.githubRepo || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
