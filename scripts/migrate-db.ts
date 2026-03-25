import fs from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const { Pool } = pg

const SEED_CATEGORIES = [
  'Electronics',
  'Books',
  'Clothing',
  'Accessories',
  'ID Cards',
  'Keys',
  'Bags',
  'Stationery',
  'Other',
]

const SEED_LOCATIONS = [
  'Library',
  'Cafeteria',
  'Hostel',
  'Lab',
  'Office',
  'Parking',
  'ohio',
]

const FALLBACK_CATEGORY = 'Other'
const FALLBACK_LOCATION = 'ohio'

type BackupShape = {
  exportedAt?: string
  users: any[]
  items: any[]
  claims: any[]
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

function normalizeName(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const backupPath = path.join(process.cwd(), 'scripts', 'backup.json')
  const backupRaw = await fs.readFile(backupPath, 'utf-8')
  const backup = JSON.parse(backupRaw) as BackupShape

  if (!Array.isArray(backup.users) || !Array.isArray(backup.items) || !Array.isArray(backup.claims)) {
    throw new Error('Invalid backup.json: expected users/items/claims arrays')
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query('DROP TABLE IF EXISTS claims CASCADE')
    await client.query('DROP TABLE IF EXISTS item_images CASCADE')
    await client.query('DROP TABLE IF EXISTS rewards CASCADE')
    await client.query('DROP TABLE IF EXISTS items CASCADE')
    await client.query('DROP TABLE IF EXISTS categories CASCADE')
    await client.query('DROP TABLE IF EXISTS locations CASCADE')
    await client.query('DROP TABLE IF EXISTS users CASCADE')

    await client.query('DROP TYPE IF EXISTS claim_status')
    await client.query('DROP TYPE IF EXISTS item_status')
    await client.query('DROP TYPE IF EXISTS item_type')

    const enums = [
      `CREATE TYPE item_type AS ENUM ('lost', 'found')`,
      `CREATE TYPE item_status AS ENUM ('open', 'claimed', 'resolved', 'closed')`,
      `CREATE TYPE claim_status AS ENUM ('pending', 'accepted', 'rejected')`,
    ]

    for (const sql of enums) {
      await client.query(sql)
    }

    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        phone VARCHAR(30),
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE items (
        id UUID PRIMARY KEY,
        type item_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
        date VARCHAR(50) NOT NULL,
        status item_status NOT NULL DEFAULT 'open',
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      CREATE TABLE item_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE (item_id)
      );
    `)

    await client.query(`
      CREATE TABLE rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE (item_id)
      );
    `)

    await client.query(`
      CREATE TABLE claims (
        id UUID PRIMARY KEY,
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        claimer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        status claim_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    for (const name of SEED_CATEGORIES) {
      await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name])
    }

    for (const name of SEED_LOCATIONS) {
      await client.query('INSERT INTO locations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name])
    }

    const categoriesResult = await client.query('SELECT id, name FROM categories')
    const locationsResult = await client.query('SELECT id, name FROM locations')

    const categoryMap = new Map<string, string>()
    const locationMap = new Map<string, string>()

    for (const row of categoriesResult.rows) {
      categoryMap.set(row.name, row.id)
    }
    for (const row of locationsResult.rows) {
      locationMap.set(row.name, row.id)
    }

    const fallbackCategoryId = categoryMap.get(FALLBACK_CATEGORY)
    const fallbackLocationId = locationMap.get(FALLBACK_LOCATION)
    if (!fallbackCategoryId || !fallbackLocationId) {
      throw new Error('Fallback category or location is not seeded')
    }

    for (const user of backup.users) {
      await client.query(
        `
        INSERT INTO users (id, google_id, email, name, avatar, phone, is_admin, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          user.id,
          user.google_id,
          user.email,
          user.name,
          user.avatar ?? null,
          user.phone ?? null,
          user.is_admin ?? false,
          user.created_at ?? new Date().toISOString(),
          user.updated_at ?? new Date().toISOString(),
        ],
      )
    }

    const itemIdSet = new Set<string>()

    for (const item of backup.items) {
      const categoryName = normalizeName(item.category) || FALLBACK_CATEGORY
      const locationName = normalizeName(item.location) || FALLBACK_LOCATION
      const categoryId = categoryMap.get(categoryName) ?? fallbackCategoryId
      const locationId = locationMap.get(locationName) ?? fallbackLocationId

      await client.query(
        `
        INSERT INTO items (id, type, title, description, category_id, location_id, date, status, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          item.id,
          item.type,
          item.title,
          item.description,
          categoryId,
          locationId,
          item.date,
          item.status ?? 'open',
          item.user_id,
          item.created_at ?? new Date().toISOString(),
          item.updated_at ?? new Date().toISOString(),
        ],
      )

      itemIdSet.add(item.id)

      const reward = typeof item.reward === 'string' ? item.reward.trim() : ''
      if (reward) {
        await client.query(
          'INSERT INTO rewards (item_id, description, created_at) VALUES ($1, $2, $3) ON CONFLICT (item_id) DO NOTHING',
          [item.id, reward, item.created_at ?? new Date().toISOString()],
        )
      }

      if (typeof item.image === 'string' && item.image.trim()) {
        const parsed = parseDataUrl(item.image)
        if (parsed) {
          await client.query(
            'INSERT INTO item_images (item_id, image_data, mime_type, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (item_id) DO NOTHING',
            [item.id, parsed.data, parsed.mimeType, item.created_at ?? new Date().toISOString()],
          )
        }
      }
    }

    const contactByUser = new Map<string, string>()
    for (const claim of backup.claims) {
      const contact = typeof claim.contact_info === 'string' ? claim.contact_info.trim() : ''
      if (contact && !contactByUser.has(claim.claimer_id)) {
        contactByUser.set(claim.claimer_id, contact)
      }
    }

    for (const [userId, phone] of contactByUser.entries()) {
      await client.query(
        'UPDATE users SET phone = $2 WHERE id = $1 AND (phone IS NULL OR phone = \'\')',
        [userId, phone],
      )
    }

    let claimsInserted = 0
    for (const claim of backup.claims) {
      if (!itemIdSet.has(claim.item_id)) continue

      await client.query(
        `
        INSERT INTO claims (id, item_id, claimer_id, message, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          claim.id,
          claim.item_id,
          claim.claimer_id,
          claim.message,
          claim.status ?? 'pending',
          claim.created_at ?? new Date().toISOString(),
        ],
      )
      claimsInserted++
    }

    await client.query('COMMIT')

    console.log(`[migrate] users=${backup.users.length} items=${backup.items.length} claims=${claimsInserted}`)
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
  console.error('[migrate] Failed:', err)
  process.exit(1)
})
