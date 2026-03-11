import { eq } from 'drizzle-orm'
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
    .select({ userId: items.userId })
    .from(items)
    .where(eq(items.id, id))
    .limit(1)

  if (existing.length === 0 || !existing[0]) {
    throw createError({ statusCode: 404, message: 'Item not found' })
  }

  if (existing[0].userId !== session.user.id && !session.user.isAdmin) {
    throw createError({ statusCode: 403, message: 'Not authorized to delete this item' })
  }

  await db.delete(items).where(eq(items.id, id))

  return { success: true }
})
