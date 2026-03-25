import { eq } from 'drizzle-orm'
import { users } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const body = await readBody(event)
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''

  if (phone && phone.length > 30) {
    throw createError({ statusCode: 400, message: 'Phone is too long.' })
  }

  const db = useDB()
  const result = await db
    .update(users)
    .set({ phone: phone || null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))
    .returning({ phone: users.phone })

  return { phone: result[0]?.phone ?? null }
})
