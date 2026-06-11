import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars (local overrides production)
dotenv.config({ path: '.env.production.local' });
dotenv.config({ path: '.env.local', override: true });

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL not found in environment variables.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log("✅ Connected to database.");

    const sqlPath = path.join(process.cwd(), 'scripts', 'migration_credit.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("🚀 Executing credit tables migration...");
    await client.query(sql);
    
    console.log("✨ Credit tables migration successful!");
  } catch (err) {
    console.error("❌ Migration failed:");
    console.error(err.message);
  } finally {
    await client.end();
  }
}

runMigration();
