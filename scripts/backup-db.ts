import fs from 'node:fs/promises'
import path from 'node:path'
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
    const users = await client.query('SELECT * FROM users')
    const items = await client.query('SELECT * FROM items')
    const claims = await client.query('SELECT * FROM claims')

    const backup = {
      exportedAt: new Date().toISOString(),
      users: users.rows,
      items: items.rows,
      claims: claims.rows,
    }

    const backupPath = path.join(process.cwd(), 'scripts', 'backup.json')
    await fs.mkdir(path.dirname(backupPath), { recursive: true })
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf-8')

    console.log(`[backup] Wrote ${backupPath}`)
    console.log(`[backup] users=${users.rows.length} items=${items.rows.length} claims=${claims.rows.length}`)
  }
  finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[backup] Failed:', err)
  process.exit(1)
})
