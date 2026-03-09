#!/usr/bin/env node

/**
 * Reset Kanban-AI settings to defaults
 * Useful when switching between LM Studio and OpenRouter
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'kanban.db');

console.log('🔧 Resetting Kanban-AI settings...\n');

try {
  const db = new Database(dbPath);
  
  // Create settings table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Delete all settings
  db.exec('DELETE FROM settings');
  console.log('✅ Deleted all settings');
  
  // Insert defaults
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
  
  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  
  for (const setting of defaultSettings) {
    insert.run(setting.key, setting.value);
  }
  
  console.log('✅ Inserted default settings\n');
  
  // Show current settings
  const rows = db.prepare('SELECT * FROM settings').all();
  console.log('📋 Current settings:');
  rows.forEach(row => {
    const isKey = row.key.includes('Key') || row.key.includes('Token');
    console.log(`  ${row.key}: ${isKey ? '***' : row.value}`);
  });
  
  db.close();
  
  console.log('\n✅ Settings reset complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Restart the backend: npm run dev:backend');
  console.log('2. Open Settings in the UI');
  console.log('3. Add your OpenRouter API key');
  console.log('4. Click "Test Connection" to verify');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure the backend is not running, then try again');
}
