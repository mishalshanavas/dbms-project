// import { RateLimiter } from 'h3-rate-limiter'

// const limiter = new RateLimiter({
//   // 100 requests per 1 minute
//   requests: 100,
//   duration: 60 * 1000,
//   // Ban for 10 minutes
//   ban: 10 * 60 * 1000,
//   // Store in memory
//   driver: {
//     name: 'memory',
//   },
// })

export default defineEventHandler(async (event) => {
  // Don't apply to preflight requests
  if (event.method === 'OPTIONS')
    return

  // Don't apply to GET requests
  if (event.method === 'GET')
    return

  // try {
  //   await limiter.check(event)
  // }
  // catch (error) {
  //   // Set status code to 429
  //   event.node.res.statusCode = 429
  //   return {
  //     error: 'Too many requests',
  //   }
  // }
})
