import { eq } from 'drizzle-orm'
import { users } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const db = useDB()
  const result = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return {
    ...session.user,
    phone: result[0]?.phone ?? null,
  }
})
