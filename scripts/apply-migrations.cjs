#!/usr/bin/env node
/**
 * apply-migrations.cjs
 * Simple script to apply all .sql files under supabase/migrations to the
 * Postgres database pointed to by POSTGRES_URL_NON_POOLING environment var.
 *
 * Usage (PowerShell):
 *   $env:POSTGRES_URL_NON_POOLING = "postgres://...";
 *   node .\scripts\apply-migrations.cjs
 *
 * Notes:
 * - This script executes entire .sql files with pg client .query(); if your
 *   SQL files contain `\i` or psql-specific meta-commands they won't work.
 * - If your Postgres server requires relaxed TLS (as sometimes with Supabase
 *   self-signed certs), set NODE_TLS_REJECT_UNAUTHORIZED=0 in the environment
 *   before running.
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.error('Could not find supabase/migrations directory at', migrationsDir)
    process.exit(1)
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No .sql migration files found in', migrationsDir)
    return
  }

  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
  if (!connectionString) {
    console.error('POSTGRES_URL_NON_POOLING or POSTGRES_URL environment variable is required')
    process.exit(1)
  }

  const client = new Client({ connectionString })

  try {
    console.log('Connecting to', connectionString.replace(/:(.*)@/, ':***@'))
    await client.connect()

    for (const f of files) {
      const filePath = path.join(migrationsDir, f)
      console.log('\n---- Applying', f, '----')
      const sql = fs.readFileSync(filePath, 'utf8')
      if (!sql.trim()) {
        console.log('Skipping empty file', f)
        continue
      }

      try {
        await client.query(sql)
        console.log('✅ Applied', f)
      } catch (err) {
        console.error('❌ Failed to apply', f)
        console.error(err && err.message ? err.message : err)
        // Stop on first failure to avoid partial application unless user wants to continue
        process.exitCode = 2
        throw err
      }
    }

    console.log('\nAll migrations applied successfully')
  } finally {
    try { await client.end() } catch (e) {}
  }
}

main().catch(err => {
  console.error('Migration runner failed:', err && err.message ? err.message : err)
  process.exit(1)
})
