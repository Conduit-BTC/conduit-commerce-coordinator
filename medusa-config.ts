import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/event-bus-local",
    },
    {
      resolve: "./src/modules/nostr-events"
    },
    {
      resolve: "./src/modules/nostr-relay-listener",
    },
    {
      resolve: "./src/modules/relay-pool"
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/strike-payment",
            id: "strike-payment",
            options: {
              apiKey: process.env.STRIKE_API_KEY!,
            }
          }
        ]
      }
    }

  ]
})
