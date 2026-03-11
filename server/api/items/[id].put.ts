import { eq, and } from 'drizzle-orm'
import { items } from '~~/db/schema'

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
  if (body.category) updates.category = body.category
  if (body.location?.trim()) updates.location = body.location.trim()
  if (body.date) updates.date = body.date
  if (body.reward !== undefined) updates.reward = body.reward?.trim() || null
  if (body.status && ['open', 'claimed', 'resolved', 'closed'].includes(body.status)) {
    updates.status = body.status
  }

  const result = await db
    .update(items)
    .set(updates)
    .where(eq(items.id, id))
    .returning()

  return result[0]
})
