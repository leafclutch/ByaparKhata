import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.production.local' });

const { Client } = pg;

// Use DATABASE_URL from your env if it exists, 
// otherwise construct it or ask for it.
// Note: Supabase provides this in Settings > Database > Connection String
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL not found in .env.local");
  console.log("Please add DATABASE_URL=\"your_connection_string\" to .env.local");
  console.log("You can find this in Supabase > Settings > Database");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase connections
});

async function runMigration() {
  try {
    await client.connect();
    console.log("✅ Connected to database.");

    const sqlPath = path.join(process.cwd(), 'scripts', 'migration_phase_2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("🚀 Executing migration...");
    await client.query(sql);
    
    console.log("✨ Migration successful!");
  } catch (err) {
    console.error("❌ Migration failed:");
    console.error(err.message);
  } finally {
    await client.end();
  }
}

runMigration();
