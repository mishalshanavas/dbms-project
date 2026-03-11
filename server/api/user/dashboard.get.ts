import { eq, desc } from 'drizzle-orm'
import { items, claims, users } from '~~/db/schema'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const db = useDB()

  // Get user's own items
  const myItems = await db
    .select({
      id: items.id,
      type: items.type,
      title: items.title,
      category: items.category,
      location: items.location,
      date: items.date,
      reward: items.reward,
      status: items.status,
      hasImage: sql<boolean>`${items.image} IS NOT NULL`,
      createdAt: items.createdAt,
      claimCount: sql<number>`(SELECT count(*) FROM claims WHERE claims.item_id = ${items.id})`,
    })
    .from(items)
    .where(eq(items.userId, session.user.id))
    .orderBy(desc(items.createdAt))

  // Get user's claims
  const myClaims = await db
    .select({
      id: claims.id,
      message: claims.message,
      status: claims.status,
      createdAt: claims.createdAt,
      item: {
        id: items.id,
        type: items.type,
        title: items.title,
        status: items.status,
      },
    })
    .from(claims)
    .leftJoin(items, eq(claims.itemId, items.id))
    .where(eq(claims.claimerId, session.user.id))
    .orderBy(desc(claims.createdAt))

  return { items: myItems, claims: myClaims }
})
