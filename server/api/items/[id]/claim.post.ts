import { eq, and } from 'drizzle-orm'
import { claims, items } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const itemId = getRouterParam(event, 'id')
  if (!itemId) {
    throw createError({ statusCode: 400, message: 'Item ID is required' })
  }

  const body = await readBody(event)

  if (!body.message?.trim()) {
    throw createError({ statusCode: 400, message: 'A message describing your claim is required' })
  }

  const db = useDB()

  // Check item exists and is open
  const item = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1)

  if (item.length === 0 || !item[0]) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  if (item[0].status !== 'open') {
    throw createError({ statusCode: 400, message: 'This item is no longer accepting claims' })
  }

  // Can't claim your own item
  if (item[0].userId === session.user.id) {
    throw createError({ statusCode: 400, message: 'You cannot claim your own item' })
  }

  // Check if already claimed by this user
  const existingClaim = await db
    .select()
    .from(claims)
    .where(and(
      eq(claims.itemId, itemId),
      eq(claims.claimerId, session.user.id),
    ))
    .limit(1)

  if (existingClaim.length > 0) {
    throw createError({ statusCode: 400, message: 'You have already submitted a claim for this item' })
  }

  const result = await db
    .insert(claims)
    .values({
      itemId,
      claimerId: session.user.id,
      message: body.message.trim(),
      contactInfo: body.contactInfo?.trim() || null,
    })
    .returning()

  return result[0]
})
