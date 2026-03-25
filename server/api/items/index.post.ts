import { eq } from 'drizzle-orm'
import { categories, itemImages, items, locations, rewards, users } from '~~/db/schema'

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

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
  if (!body.categoryId) {
    throw createError({ statusCode: 400, message: 'Category is required.' })
  }
  if (!body.locationId) {
    throw createError({ statusCode: 400, message: 'Location is required.' })
  }
  if (!body.date) {
    throw createError({ statusCode: 400, message: 'Date is required.' })
  }

  // Validate image size if provided (~300KB base64 ≈ ~400KB string)
  if (body.image && body.image.length > 500_000) {
    throw createError({ statusCode: 400, message: 'Image too large. Please compress to under 300KB.' })
  }

  const db = useDB()

  const category = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, body.categoryId))
    .limit(1)

  if (!category.length) {
    throw createError({ statusCode: 400, message: 'Invalid category.' })
  }

  const location = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.id, body.locationId))
    .limit(1)

  if (!location.length) {
    throw createError({ statusCode: 400, message: 'Invalid location.' })
  }

  let effectiveUserId = session.user.id
  const userById = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!userById.length && session.user.email) {
    const userByEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)
    if (userByEmail.length) {
      effectiveUserId = userByEmail[0]!.id
      await setUserSession(event, {
        user: {
          ...session.user,
          id: effectiveUserId,
        },
      })
    }
  }

  if (!userById.length && effectiveUserId === session.user.id) {
    throw createError({ statusCode: 401, message: 'User profile not found. Please sign in again.' })
  }

  const result = await db.transaction(async (tx) => {
    const created = await tx
      .insert(items)
      .values({
        type: body.type,
        title: body.title.trim(),
        description: body.description.trim(),
        categoryId: body.categoryId,
        locationId: body.locationId,
        date: body.date,
        status: 'open',
        userId: effectiveUserId,
      })
      .returning()

    const item = created[0]

    const rewardText = typeof body.reward === 'string' ? body.reward.trim() : ''
    if (rewardText) {
      await tx.insert(rewards).values({ itemId: item.id, description: rewardText })
    }

    if (typeof body.image === 'string' && body.image.trim()) {
      const parsed = parseImageDataUrl(body.image)
      if (!parsed) {
        throw createError({ statusCode: 400, message: 'Invalid image data.' })
      }
      await tx.insert(itemImages).values({
        itemId: item.id,
        imageData: parsed.data,
        mimeType: parsed.mimeType,
      })
    }

    return item
  })

  return result
})
