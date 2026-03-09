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
    openRouterModel: 'google/gemma-3-1b-itb-freetrial:free',
    useOpenRouter: false,
  };

  for (const row of rows) {
    const value = row.value;
    if (/^\d+$/.test(value)) {
      settings[row.key] = parseInt(value, 10);
    } else if (value === 'true' || value === 'false') {
      settings[row.key] = value === 'true';
    } else {
      settings[row.key] = value;
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
