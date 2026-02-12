import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(__dirname, '../src/lib/schema-v2.sql'), 'utf-8');

// Use Supabase Pooler (IPv4) instead of direct DB (IPv6 only)
const client = new pg.Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zswetqhhoqrnfikdxrnn',
  password: 'fyg0YyegcFyjXApP',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected to Supabase via Pooler (IPv4)');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of statements) {
  try {
    await client.query(stmt);
    console.log('OK:', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''));
  } catch (err) {
    if (err.code === '42P07' || err.code === '42710') {
      console.log('SKIP (already exists):', stmt.slice(0, 80));
    } else if (err.code === '25001') {
      console.log('SKIP (DDL not in transaction):', stmt.slice(0, 80));
    } else {
      console.error('ERR:', err.message);
      console.error('SQL:', stmt.slice(0, 120));
    }
  }
}

await client.end();
console.log('Migration v2 complete');
