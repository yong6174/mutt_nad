import pg from 'pg';

const client = new pg.Client({
  host: 'db.zswetqhhoqrnfikdxrnn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'fyg0YyegcFyjXApP',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const statements = [
  // Enable RLS
  'ALTER TABLE mutts ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE ratings ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE activities ENABLE ROW LEVEL SECURITY',

  // Public read for all tables (anon can read)
  `CREATE POLICY "mutts_read" ON mutts FOR SELECT TO anon USING (true)`,
  `CREATE POLICY "ratings_read" ON ratings FOR SELECT TO anon USING (true)`,
  `CREATE POLICY "activities_read" ON activities FOR SELECT TO anon USING (true)`,

  // Service role can do everything (API routes use service_role key)
  `CREATE POLICY "mutts_service" ON mutts FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "ratings_service" ON ratings FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "activities_service" ON activities FOR ALL TO service_role USING (true) WITH CHECK (true)`,
];

for (const stmt of statements) {
  try {
    await client.query(stmt);
    console.log('OK:', stmt.slice(0, 70));
  } catch (err) {
    if (err.code === '42710') {
      console.log('SKIP (exists):', stmt.slice(0, 70));
    } else {
      console.error('ERR:', err.message, '|', stmt.slice(0, 70));
    }
  }
}

await client.end();
console.log('RLS setup complete');
