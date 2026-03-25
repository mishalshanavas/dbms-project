import { eq, desc, sql } from 'drizzle-orm'
import { categories, claims, itemImages, items, locations, rewards } from '~~/db/schema'

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
      category: categories.name,
      location: locations.name,
      date: items.date,
      reward: rewards.description,
      status: items.status,
      hasImage: sql<boolean>`EXISTS (SELECT 1 FROM ${itemImages} WHERE ${itemImages.itemId} = ${items.id})`,
      createdAt: items.createdAt,
      claimCount: sql<number>`(SELECT count(*) FROM claims WHERE claims.item_id = ${items.id})`,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .leftJoin(locations, eq(items.locationId, locations.id))
    .leftJoin(rewards, eq(items.id, rewards.itemId))
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
