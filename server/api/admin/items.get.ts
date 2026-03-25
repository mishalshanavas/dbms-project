import { desc, sql, eq } from 'drizzle-orm'
import { categories, items, locations, users, claims } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.isAdmin) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const query = getQuery(event) as {
    status?: string
    page?: string
    limit?: string
  }

  const db = useDB()
  const page = Math.max(1, parseInt(query.page || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50')))
  const offset = (page - 1) * limit

  const conditions = []
  if (query.status && ['open', 'claimed', 'resolved', 'closed'].includes(query.status)) {
    conditions.push(eq(items.status, query.status as 'open' | 'claimed' | 'resolved' | 'closed'))
  }

  const where = conditions.length > 0 ? conditions[0] : undefined

  const result = await db
    .select({
      id: items.id,
      type: items.type,
      title: items.title,
      category: categories.name,
      location: locations.name,
      status: items.status,
      createdAt: items.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      claimCount: sql<number>`(SELECT count(*) FROM claims WHERE claims.item_id = ${items.id})`,
    })
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .leftJoin(locations, eq(items.locationId, locations.id))
    .where(where)
    .orderBy(desc(items.createdAt))
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(where)

  // Stats
  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      open: sql<number>`count(*) FILTER (WHERE ${items.status} = 'open')`,
      claimed: sql<number>`count(*) FILTER (WHERE ${items.status} = 'claimed')`,
      resolved: sql<number>`count(*) FILTER (WHERE ${items.status} = 'resolved')`,
    })
    .from(items)

  return {
    items: result,
    stats: stats[0],
    pagination: {
      page,
      limit,
      total: Number(countResult[0]?.count ?? 0),
      totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
    },
  }
})
