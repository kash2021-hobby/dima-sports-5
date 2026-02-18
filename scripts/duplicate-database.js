/**
 * Duplicate DHSA PostgreSQL database using Node.js and pg.
 * Creates a new database and copies all schema + data from the original.
 * Run: node scripts/duplicate-database.js
 * Requires: npm install pg (and dotenv if not already present)
 */

const path = require('path');
const fs = require('fs');

// Read .env so we always use file as source (ignore process.env.DATABASE_URL)
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\s#]+)/);
if (!match) throw new Error('DATABASE_URL not found in .env');
process.env.DATABASE_URL = match[1].trim();
require('dotenv').config({ path: envPath });

const NEW_DB_NAME = 'dhsa_db_duplicate';

// Tables in dependency order (so FKs are satisfied)
const TABLE_ORDER = [
  'users',
  'teams',
  'tournaments',
  'players',
  'player_applications',
  'coaches',
  'team_coaches',
  'trials',
  'documents',
];

function getConnectionConfig(dbName) {
  const url = dbName
    ? process.env.DATABASE_URL.replace(/\/[^/]+\?/, `/${dbName}?`)
    : process.env.DATABASE_URL;
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL');
  const [, user, password, host, port] = match;
  return {
    user,
    password,
    host,
    port: parseInt(port, 10),
    database: dbName || match[5],
  };
}

async function runWithClient(config, fn) {
  const { Client } = require('pg');
  const client = new Client(config);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function main() {
  const originalConfig = getConnectionConfig(null);
  const dbNameFromUrl = originalConfig.database;
  const baseConfig = {
    user: originalConfig.user,
    password: originalConfig.password,
    host: originalConfig.host,
    port: originalConfig.port,
  };

  console.log('Original database:', dbNameFromUrl);
  console.log('New database:', NEW_DB_NAME);
  console.log('');

  // 1. Create new database (connect to "postgres")
  console.log('[1/4] Creating database...');
  await runWithClient({ ...baseConfig, database: 'postgres' }, async (client) => {
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [NEW_DB_NAME]
    );
    if (res.rows.length > 0) {
      await client.query(`DROP DATABASE ${NEW_DB_NAME}`);
    }
    await client.query(`CREATE DATABASE ${NEW_DB_NAME}`);
  });
  console.log('Done.\n');

  // 2. Apply schema to new DB (run Prisma migrations)
  console.log('[2/4] Applying schema (Prisma migrations)...');
  const newDbUrl = process.env.DATABASE_URL.replace(
    new RegExp(`/${dbNameFromUrl}\\?`),
    `/${NEW_DB_NAME}?`
  );
  const { execSync } = require('child_process');
  const cwd = path.join(__dirname, '..');
  const env = { ...process.env, DATABASE_URL: newDbUrl };
  const execOpts = { env, cwd, encoding: 'utf8', stdio: 'pipe' };
  try {
    execSync('npx prisma migrate deploy', execOpts);
  } catch (e) {
    console.log('Trying prisma db push as fallback...');
    try {
      execSync('npx prisma db push --accept-data-loss', execOpts);
    } catch (e2) {
      if (e2.stderr) console.error(e2.stderr.toString());
      if (e2.stdout) console.log(e2.stdout.toString());
      throw new Error('Prisma migrate deploy and db push failed');
    }
  }
  console.log('Done.\n');

  // 3. Copy data table by table
  console.log('[3/4] Copying data...');
  const sourceConfig = { ...baseConfig, database: dbNameFromUrl };
  const targetConfig = { ...baseConfig, database: NEW_DB_NAME };

  for (const table of TABLE_ORDER) {
    const [sourceClient, targetClient] = await Promise.all([
      (async () => {
        const { Client } = require('pg');
        const c = new Client(sourceConfig);
        await c.connect();
        return c;
      })(),
      (async () => {
        const { Client } = require('pg');
        const c = new Client(targetConfig);
        await c.connect();
        return c;
      })(),
    ]);

    try {
      let rows;
      try {
        rows = await sourceClient.query(`SELECT * FROM "${table}"`);
      } catch (e) {
        if (e.code === '42P01') {
          console.log(`  ${table}: (table missing in source, skip)`);
          continue;
        }
        throw e;
      }
      if (rows.rows.length === 0) {
        console.log(`  ${table}: 0 rows`);
        continue;
      }
      const columns = Object.keys(rows.rows[0]);
      const colList = columns.map((c) => `"${c}"`).join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertSql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      for (const row of rows.rows) {
        const values = columns.map((col) => row[col]);
        await targetClient.query(insertSql, values);
      }
      console.log(`  ${table}: ${rows.rows.length} rows`);
    } catch (err) {
      throw err;
    } finally {
      await sourceClient.end();
      await targetClient.end();
    }
  }
  console.log('Done.\n');

  // 4. Reset sequences so new inserts get correct IDs (optional but recommended)
  console.log('[4/4] Resetting sequences...');
  await runWithClient(targetConfig, async (client) => {
    for (const table of TABLE_ORDER) {
      const pkRes = await client.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = '"${table}"'::regclass AND a.attnum > 0 AND NOT a.attisdropped
      `);
      if (pkRes.rows.length === 0) continue;
      const pk = pkRes.rows[0].attname;
      const seqRes = await client.query(`
        SELECT pg_get_serial_sequence('"${table}"', '${pk}') AS seq
      `);
      const seq = seqRes.rows[0]?.seq;
      if (seq) {
        await client.query(`SELECT setval($1, (SELECT COALESCE(MAX("${pk}"), 1) FROM "${table}"))`, [seq]);
      }
    }
  });
  console.log('Done.\n');

  console.log('Duplicate database is ready.');
  console.log('Update .env to use it:');
  console.log(`  DATABASE_URL="${newDbUrl}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
