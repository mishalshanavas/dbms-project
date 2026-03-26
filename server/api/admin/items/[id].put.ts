import { eq } from 'drizzle-orm'
import { items } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.isAdmin) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Item ID is required' })
  }

  const body = await readBody(event)
  const db = useDB()

  const item = await db.select({ status: items.status }).from(items).where(eq(items.id, id)).limit(1)
  if (!item.length)
    throw createError({ statusCode: 404, message: 'Item not found' })

  const currentStatus = item[0].status
  const newStatus = body.status

  if (newStatus && currentStatus !== newStatus) {
    // Admin can do more, but let's enforce some logic for safety
    if (currentStatus === 'resolved' || currentStatus === 'closed') {
      // Allow reopening
      if (newStatus !== 'open')
        throw createError({ statusCode: 400, message: `Cannot change status from '${currentStatus}' to '${newStatus}'. Can only reopen.` })
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (newStatus && ['open', 'claimed', 'resolved', 'closed'].includes(newStatus)) {
    updates.status = newStatus
  }

  const result = await db
    .update(items)
    .set(updates)
    .where(eq(items.id, id))
    .returning()

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  return result[0]
})
