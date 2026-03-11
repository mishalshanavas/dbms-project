import { eq } from 'drizzle-orm'
import { users } from '~~/db/schema'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile'],
    authorizationParams: {
      hd: 'sahrdaya.ac.in',
      prompt: 'select_account',
    },
  },
  async onSuccess(event, { user: googleUser }) {
    // Validate domain — SECURITY: server-side check is mandatory
    const email = googleUser.email as string
    if (!email.endsWith('@sahrdaya.ac.in')) {
      throw createError({
        statusCode: 403,
        message: 'Only @sahrdaya.ac.in accounts are allowed',
      })
    }

    const db = useDB()
    const config = useRuntimeConfig()

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.googleId, String(googleUser.sub)))
      .limit(1)

    const adminEmails = config.adminEmails
      ? config.adminEmails.split(',').map((e: string) => e.trim().toLowerCase())
      : []
    const isAdmin = adminEmails.includes(email.toLowerCase())

    let dbUser: typeof existing[0]

    if (existing.length > 0 && existing[0]) {
      // Update existing user
      const updated = await db
        .update(users)
        .set({
          name: googleUser.name as string,
          avatar: googleUser.picture as string,
          isAdmin: isAdmin || existing[0].isAdmin,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id))
        .returning()
      dbUser = updated[0]!
    }
    else {
      // Create new user
      const created = await db
        .insert(users)
        .values({
          googleId: String(googleUser.sub),
          email,
          name: googleUser.name as string,
          avatar: googleUser.picture as string,
          isAdmin,
        })
        .returning()
      dbUser = created[0]!
    }

    // Set session
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        isAdmin: dbUser.isAdmin,
      },
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('[Auth] Google OAuth error:', error)
    return sendRedirect(event, '/login?error=auth_failed')
  },
})
