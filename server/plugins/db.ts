import { initializeDB } from '../utils/db'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  if (!config.databaseUrl) {
    console.warn('[DB] DATABASE_URL not set — skipping database initialization')
    return
  }
  try {
    await initializeDB()
  }
  catch (error) {
    console.error('[DB] Plugin initialization failed:', error)
  }
})
