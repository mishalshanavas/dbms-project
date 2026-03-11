import { eq } from 'drizzle-orm'
import { items } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Item ID required' })
  }

  const db = useDB()
  const result = await db
    .select({ image: items.image })
    .from(items)
    .where(eq(items.id, id))
    .limit(1)

  if (!result.length || !result[0]?.image) {
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  // Parse base64 data URL and return as image
  const dataUrl = result[0].image
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!matches || !matches[1] || !matches[2]) {
    throw createError({ statusCode: 500, message: 'Invalid image data' })
  }

  const contentType = matches[1]
  const buffer = Buffer.from(matches[2], 'base64')

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Content-Length': buffer.length.toString(),
    'Cache-Control': 'public, max-age=86400',
  })

  return buffer
})
