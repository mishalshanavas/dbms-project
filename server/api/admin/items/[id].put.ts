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

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.status && ['open', 'claimed', 'resolved', 'closed'].includes(body.status)) {
    updates.status = body.status
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
