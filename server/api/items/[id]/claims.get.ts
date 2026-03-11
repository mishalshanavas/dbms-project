import { eq } from 'drizzle-orm'
import { claims, users, items } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const itemId = getRouterParam(event, 'id')
  if (!itemId) {
    throw createError({ statusCode: 400, message: 'Item ID is required' })
  }

  const db = useDB()

  // Only item owner or admin can view claims
  const item = await db
    .select({ userId: items.userId })
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1)

  if (item.length === 0 || !item[0]) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  const itemOwner = item[0]
  if (itemOwner.userId !== session.user.id && !session.user.isAdmin) {
    throw createError({ statusCode: 403, message: 'Only the item owner or admin can view claims' })
  }

  const result = await db
    .select({
      id: claims.id,
      message: claims.message,
      contactInfo: claims.contactInfo,
      status: claims.status,
      createdAt: claims.createdAt,
      claimer: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      },
    })
    .from(claims)
    .leftJoin(users, eq(claims.claimerId, users.id))
    .where(eq(claims.itemId, itemId))

  return result
})
