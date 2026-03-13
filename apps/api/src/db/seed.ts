import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function seed() {
  console.log('Seeding database with mock data...');

  const seedDir = path.join(__dirname, 'seed');
  const files = fs.readdirSync(seedDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    console.log(`  Running: ${file}`);
    const sql = fs.readFileSync(path.join(seedDir, file), 'utf-8');
    await pool.query(sql);
    console.log(`  Done: ${file}`);
  }

  console.log('Seeding completed.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
