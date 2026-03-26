import { eq, and } from 'drizzle-orm'
import { categories, items, locations, rewards } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Item ID is required' })
  }

  const db = useDB()

  // Check ownership (or admin)
  const existing = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1)

  if (existing.length === 0 || !existing[0]) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  if (existing[0].userId !== session.user.id && !session.user.isAdmin) {
    throw createError({ statusCode: 403, message: 'Not authorized to edit this item' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.title?.trim()) updates.title = body.title.trim()
  if (body.description?.trim()) updates.description = body.description.trim()
  if (body.categoryId) updates.categoryId = body.categoryId
  if (body.locationId) updates.locationId = body.locationId
  if (body.date) updates.date = body.date

  const newStatus = body.status
  if (newStatus && newStatus !== existing[0].status) {
    const currentStatus = existing[0].status
    // User-initiated status changes should be limited
    if (currentStatus === 'open' && newStatus === 'closed') {
      updates.status = newStatus // Owner can close their own post
    }
    else if (currentStatus === 'claimed' && newStatus === 'resolved') {
      updates.status = newStatus // Owner can mark as resolved after a claim is accepted
    }
    else {
      throw createError({
        statusCode: 400,
        message: `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
      })
    }
  }

  if (body.categoryId) {
    const category = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, body.categoryId))
      .limit(1)
    if (!category.length) {
      throw createError({ statusCode: 400, message: 'Invalid category.' })
    }
  }

  if (body.locationId) {
    const location = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.id, body.locationId))
      .limit(1)
    if (!location.length) {
      throw createError({ statusCode: 400, message: 'Invalid location.' })
    }
  }

  const rewardText = body.reward !== undefined && body.reward !== null
    ? String(body.reward).trim()
    : undefined

  const updated = await db.transaction(async (tx) => {
    const result = await tx
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning()

    if (rewardText !== undefined) {
      await tx.delete(rewards).where(eq(rewards.itemId, id))
      if (rewardText) {
        await tx.insert(rewards).values({ itemId: id, description: rewardText })
      }
    }

    return result[0]
  })

  return updated
})
