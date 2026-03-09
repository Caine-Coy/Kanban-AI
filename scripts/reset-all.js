#!/usr/bin/env node

/**
 * Complete factory reset for Kanban-AI
 * Deletes database and all project folders
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'kanban.db');
const projectsDir = join(projectRoot, 'Projects');

console.log('⚠️  FACTORY RESET - This will delete ALL data!\n');
console.log('This will remove:');
console.log('  - All settings');
console.log('  - All projects');
console.log('  - All tickets');
console.log('  - All agents');
console.log('  - All tasks');
console.log('  - All project folders in Projects/\n');

const readline = await import('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const answer = await new Promise((resolve) => {
  rl.question('Are you sure you want to continue? Type "yes" to confirm: ', resolve);
});

rl.close();

if (answer.toLowerCase() !== 'yes') {
  console.log('\n❌ Reset cancelled.');
  process.exit(0);
}

console.log('\n🔧 Starting factory reset...\n');

try {
  // Delete database files
  const dbFiles = ['kanban.db', 'kanban.db-shm', 'kanban.db-wal'];
  for (const file of dbFiles) {
    const filePath = join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      rmSync(filePath);
      console.log(`✅ Deleted ${file}`);
    }
  }

  // Delete Projects folder
  if (fs.existsSync(projectsDir)) {
    rmSync(projectsDir, { recursive: true, force: true });
    console.log('✅ Deleted Projects/ folder');
  }

  console.log('\n✅ Factory reset complete!\n');
  console.log('💡 Next steps:');
  console.log('1. Start the app: npm run dev');
  console.log('2. You will see the welcome screen');
  console.log('3. Create your first project');
  console.log('4. Configure settings in the Settings modal\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure the backend is not running, then try again');
  process.exit(1);
}
