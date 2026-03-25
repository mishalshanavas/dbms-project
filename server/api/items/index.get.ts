import { eq, desc, and, or, ilike, sql } from 'drizzle-orm'
import { categories, itemImages, items, locations, rewards, users } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as {
    type?: 'lost' | 'found'
    categoryId?: string
    status?: string
    search?: string
    page?: string
    limit?: string
  }

  const db = useDB()
  const page = Math.max(1, parseInt(query.page || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20')))
  const offset = (page - 1) * limit

  // Build conditions
  const conditions = []

  if (query.type && ['lost', 'found'].includes(query.type)) {
    conditions.push(eq(items.type, query.type))
  }

  if (query.categoryId) {
    conditions.push(eq(items.categoryId, query.categoryId))
  }

  if (query.status && ['open', 'claimed', 'resolved', 'closed'].includes(query.status)) {
    conditions.push(eq(items.status, query.status as 'open' | 'claimed' | 'resolved' | 'closed'))
  }
  else {
    // Default: show only open items
    conditions.push(eq(items.status, 'open'))
  }

  if (query.search) {
    conditions.push(
      or(
        ilike(items.title, `%${query.search}%`),
        ilike(items.description, `%${query.search}%`),
        ilike(locations.name, `%${query.search}%`),
      ),
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  // Get items with user info (exclude image for list view performance)
  const result = await db
    .select({
      id: items.id,
      type: items.type,
      title: items.title,
      description: items.description,
      category: {
        id: categories.id,
        name: categories.name,
      },
      location: {
        id: locations.id,
        name: locations.name,
      },
      date: items.date,
      reward: rewards.description,
      status: items.status,
      hasImage: sql<boolean>`EXISTS (SELECT 1 FROM ${itemImages} WHERE ${itemImages.itemId} = ${items.id})`,
      createdAt: items.createdAt,
      user: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .leftJoin(locations, eq(items.locationId, locations.id))
    .leftJoin(rewards, eq(items.id, rewards.itemId))
    .where(where)
    .orderBy(desc(items.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(where)

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
