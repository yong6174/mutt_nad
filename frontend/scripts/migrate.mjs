import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(__dirname, '../src/lib/schema.sql'), 'utf-8');

const client = new pg.Client({
  host: 'db.zswetqhhoqrnfikdxrnn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'fyg0YyegcFyjXApP',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected to Supabase Postgres');

// Split by semicolons and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of statements) {
  try {
    await client.query(stmt);
    console.log('OK:', stmt.slice(0, 60) + '...');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('SKIP (already exists):', stmt.slice(0, 60) + '...');
    } else {
      console.error('ERR:', err.message);
      console.error('SQL:', stmt.slice(0, 100));
    }
  }
}

await client.end();
console.log('Migration complete');
