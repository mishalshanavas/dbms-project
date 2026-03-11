// Protect all /api routes except public ones
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Public routes that don't need auth
  const publicPaths = [
    '/api/items',       // GET list is public
    '/api/items/',      // GET single item is public
    '/api/health',
  ]

  // Allow GET requests to public paths
  if (event.method === 'GET' && publicPaths.some(p => path.startsWith(p))) {
    return
  }

  // Auth routes don't need protection
  if (path.startsWith('/auth/') || path.startsWith('/api/_')) {
    return
  }

  // All other API routes require authentication
  if (path.startsWith('/api/')) {
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required',
      })
    }
    // Attach user to event context for downstream handlers
    event.context.user = session.user
  }
})
