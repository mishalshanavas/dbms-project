import { eq } from 'drizzle-orm'
import { itemImages } from '~~/db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Item ID required' })
  }

  const db = useDB()
  const result = await db
    .select({ imageData: itemImages.imageData, mimeType: itemImages.mimeType })
    .from(itemImages)
    .where(eq(itemImages.itemId, id))
    .limit(1)

  if (!result.length || !result[0]?.imageData || !result[0]?.mimeType) {
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  const buffer = Buffer.from(result[0].imageData, 'base64')

  setResponseHeaders(event, {
    'Content-Type': result[0].mimeType,
    'Content-Length': buffer.length.toString(),
    'Cache-Control': 'public, max-age=86400',
  })

  return buffer
})
