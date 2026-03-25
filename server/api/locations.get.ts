import { asc } from 'drizzle-orm'
import { locations } from '~~/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const result = await db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .orderBy(asc(locations.name))

  return result
})
