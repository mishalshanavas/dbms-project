import { eq, sql, and } from 'drizzle-orm'
import { items, users, claims } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Item ID is required' })
  }

  const db = useDB()

  // Get item with user info (include image for detail view)
  const result = await db
    .select({
      id: items.id,
      type: items.type,
      title: items.title,
      description: items.description,
      category: items.category,
      location: items.location,
      date: items.date,
      reward: items.reward,
      image: items.image,
      status: items.status,
      createdAt: items.createdAt,
      user: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        email: users.email,
      },
    })
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .where(eq(items.id, id))
    .limit(1)

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  // Get claim count
  const claimCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(claims)
    .where(eq(claims.itemId, id))

  // Check if current user has already claimed this item
  let alreadyClaimed = false
  const session = await getUserSession(event).catch(() => null)
  if (session?.user?.id) {
    const existing = await db
      .select({ id: claims.id })
      .from(claims)
      .where(and(eq(claims.itemId, id), eq(claims.claimerId, session.user.id)))
      .limit(1)
    alreadyClaimed = existing.length > 0
  }

  return {
    ...result[0],
    claimCount: Number(claimCount[0]?.count ?? 0),
    alreadyClaimed,
  }
})
