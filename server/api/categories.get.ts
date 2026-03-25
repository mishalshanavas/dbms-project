import { asc } from 'drizzle-orm'
import { categories } from '~~/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const result = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name))

  return result
})
