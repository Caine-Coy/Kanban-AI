import { getDatabase } from './index.js';
import type { Settings } from 'shared';

export function getSettings(): Settings {
  const db = getDatabase();
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as { key: string; value: string }[];

  const settings: any = {
    testTimeout: 60000,
    lmStudioUrl: 'http://localhost:1234',
    lmStudioModel: 'default',
    gitRemote: 'origin',
    testCommand: 'npm test',
    openRouterUrl: 'https://openrouter.ai/api/v1',
    openRouterModel: 'openrouter/free',
    useOpenRouter: true, // Default to OpenRouter for easier setup
  };

  // Load from environment variables (overrides database)
  if (process.env.OPENROUTER_KEY) {
    settings.openRouterKey = process.env.OPENROUTER_KEY;
    console.log('🔑 OpenRouter API key loaded from environment');
  }
  if (process.env.OPENROUTER_URL) {
    settings.openRouterUrl = process.env.OPENROUTER_URL;
  }
  if (process.env.OPENROUTER_MODEL) {
    settings.openRouterModel = process.env.OPENROUTER_MODEL;
  }
  if (process.env.GITHUB_TOKEN) {
    settings.githubToken = process.env.GITHUB_TOKEN;
  }
  if (process.env.GITHUB_OWNER) {
    settings.githubOwner = process.env.GITHUB_OWNER;
  }
  if (process.env.GITHUB_REPO) {
    settings.githubRepo = process.env.GITHUB_REPO;
  }

  // Load from database (environment variables take precedence)
  for (const row of rows) {
    const value = row.value;
    if (/^\d+$/.test(value)) {
      settings[row.key] = parseInt(value, 10);
    } else if (value === 'true' || value === 'false') {
      settings[row.key] = value === 'true';
    } else {
      // Don't override if env var is set
      if (!process.env.OPENROUTER_KEY || row.key !== 'openRouterKey') {
        settings[row.key] = value;
      }
    }
  }

  return settings as Settings;
}

export function updateSetting(key: string, value: string | number): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updatedAt)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?
  `);

  const stringValue = typeof value === 'number' ? value.toString() : value;
  stmt.run(key, stringValue, now, stringValue, now);
}

export function getSetting(key: string): string | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;

  return row?.value;
}
