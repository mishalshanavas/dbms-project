import { eq, and } from 'drizzle-orm'
import { claims, items } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const itemId = getRouterParam(event, 'id')
  const claimId = getRouterParam(event, 'claimId')
  if (!itemId || !claimId) {
    throw createError({ statusCode: 400, message: 'Item ID and Claim ID are required' })
  }

  const body = await readBody(event)
  if (!body.status || !['accepted', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Status must be "accepted" or "rejected"' })
  }

  const db = useDB()

  // Verify item ownership
  const item = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1)

  if (item.length === 0 || !item[0]) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  if (item[0].userId !== session.user.id && !session.user.isAdmin) {
    throw createError({ statusCode: 403, message: 'Not authorized' })
  }

  // Update claim status
  const result = await db
    .update(claims)
    .set({ status: body.status })
    .where(and(eq(claims.id, claimId), eq(claims.itemId, itemId)))
    .returning()

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Claim not found' })
  }

  // If accepted, mark item as resolved
  if (body.status === 'accepted') {
    await db
      .update(items)
      .set({ status: 'resolved', updatedAt: new Date() })
      .where(eq(items.id, itemId))
  }

  return result[0]
})
