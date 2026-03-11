import { items } from '~~/db/schema'
import { CATEGORIES } from '~~/shared/utils/categories'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const body = await readBody(event)

  // Validate required fields
  if (!body.type || !['lost', 'found'].includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Invalid type. Must be "lost" or "found".' })
  }
  if (!body.title?.trim() || body.title.length > 255) {
    throw createError({ statusCode: 400, message: 'Title is required (max 255 chars).' })
  }
  if (!body.description?.trim()) {
    throw createError({ statusCode: 400, message: 'Description is required.' })
  }
  if (!body.category || !(CATEGORIES as readonly string[]).includes(body.category)) {
    throw createError({ statusCode: 400, message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` })
  }
  if (!body.location?.trim() || body.location.length > 255) {
    throw createError({ statusCode: 400, message: 'Location is required (max 255 chars).' })
  }
  if (!body.date) {
    throw createError({ statusCode: 400, message: 'Date is required.' })
  }

  // Validate image size if provided (~300KB base64 ≈ ~400KB string)
  if (body.image && body.image.length > 500_000) {
    throw createError({ statusCode: 400, message: 'Image too large. Please compress to under 300KB.' })
  }

  const db = useDB()

  const result = await db
    .insert(items)
    .values({
      type: body.type,
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category,
      location: body.location.trim(),
      date: body.date,
      reward: body.reward?.trim() || null,
      image: body.image || null,
      userId: session.user.id,
    })
    .returning()

  return result[0]
})
