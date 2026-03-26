import pg from 'pg'

const { Pool } = pg

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`
      TRUNCATE TABLE
        item_images,
        rewards,
        claims,
        items,
        users
      CASCADE
    `)
    await client.query('COMMIT')
    console.log('[clear] Truncated data tables (kept categories, locations)')
  }
  catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
  finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[clear] Failed:', err)
  process.exit(1)
})
