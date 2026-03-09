import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return db;
}

export function setupDatabase(): void {
  db = new Database(':memory:');
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      gitRemote TEXT NOT NULL DEFAULT 'origin',
      githubOwner TEXT,
      githubRepo TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'BACKLOG',
      assignee TEXT,
      branch TEXT,
      requirements TEXT,
      testCommand TEXT,
      testTimeout INTEGER,
      projectId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IDLE',
      currentTicketId TEXT,
      lastActive DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (currentTicketId) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      agentId TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      branch TEXT NOT NULL,
      startedAt DATETIME,
      completedAt DATETIME,
      error TEXT,
      logs TEXT DEFAULT '[]',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticketId) REFERENCES tickets(id),
      FOREIGN KEY (agentId) REFERENCES agents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_projectId ON tickets(projectId);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_ticketId ON tasks(ticketId);
  `);

  // Insert default settings
  const defaultSettings = [
    { key: 'lmStudioUrl', value: 'http://localhost:1234' },
    { key: 'lmStudioModel', value: 'default' },
    { key: 'gitRemote', value: 'origin' },
    { key: 'testCommand', value: 'npm test' },
    { key: 'testTimeout', value: '60000' },
    { key: 'openRouterUrl', value: 'https://openrouter.ai/api/v1' },
    { key: 'openRouterModel', value: 'google/gemma-3-1b-itb-freetrial:free' },
    { key: 'useOpenRouter', value: 'true' },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  const transaction = db.transaction((settings) => {
    for (const setting of settings) {
      insert.run(setting.key, setting.value);
    }
  });

  transaction(defaultSettings);

  // Insert default columns (stored in code, but we can track order in DB)
  db.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL UNIQUE,
      "order" INTEGER NOT NULL UNIQUE
    );
  `);

  const columnInsert = db.prepare(`
    INSERT OR IGNORE INTO columns (id, title, status, "order") VALUES (?, ?, ?, ?)
  `);

  const columns = [
    { id: uuidv4(), title: 'Backlog', status: 'BACKLOG', order: 0 },
    { id: uuidv4(), title: 'TODO', status: 'TODO', order: 1 },
    { id: uuidv4(), title: 'In Progress', status: 'IN_PROGRESS', order: 2 },
    { id: uuidv4(), title: 'Review', status: 'REVIEW', order: 3 },
    { id: uuidv4(), title: 'Done', status: 'DONE', order: 4 },
  ];

  const columnTransaction = db.transaction((cols) => {
    for (const col of cols) {
      columnInsert.run(col.id, col.title, col.status, col.order);
    }
  });

  columnTransaction(columns);

  console.log('✅ Database initialized');
}

export default db;
