import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '~~/db/schema'

const { Pool } = pg

let _pool: pg.Pool | null = null

function getPool() {
  if (!_pool) {
    const config = useRuntimeConfig()
    _pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return _pool
}

export function useDB() {
  return drizzle(getPool(), { schema })
}

// Initialize database tables (run on first connection)
export async function initializeDB() {
  const pool = getPool()
  const client = await pool.connect()
  try {
    // Create enums if they don't exist (CockroachDB doesn't support DO $$ blocks for CREATE TYPE)
    const enums = [
      `CREATE TYPE item_type AS ENUM ('lost', 'found')`,
      `CREATE TYPE item_status AS ENUM ('open', 'claimed', 'resolved', 'closed')`,
      `CREATE TYPE claim_status AS ENUM ('pending', 'accepted', 'rejected')`,
    ]
    for (const sql of enums) {
      try {
        await client.query(sql)
      }
      catch (e: any) {
        // Ignore "already exists" errors (42710 = duplicate_object)
        if (e.code !== '42710') throw e
      }
    }

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type item_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        reward VARCHAR(255),
        image TEXT,
        status item_status NOT NULL DEFAULT 'open',
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        claimer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        contact_info VARCHAR(255),
        status claim_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    console.log('[DB] Tables initialized successfully')
  }
  catch (error) {
    console.error('[DB] Failed to initialize tables:', error)
    throw error
  }
  finally {
    client.release()
  }
}
