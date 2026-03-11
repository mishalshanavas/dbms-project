import { pgTable, text, timestamp, varchar, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core'

// Enums
export const itemTypeEnum = pgEnum('item_type', ['lost', 'found'])
export const itemStatusEnum = pgEnum('item_status', ['open', 'claimed', 'resolved', 'closed'])
export const claimStatusEnum = pgEnum('claim_status', ['pending', 'accepted', 'rejected'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: varchar('google_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Items table (lost & found listings)
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: itemTypeEnum('type').notNull(), // 'lost' or 'found'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  date: varchar('date', { length: 50 }).notNull(), // date when lost/found
  reward: varchar('reward', { length: 255 }), // optional reward text (e.g., "₹500" or "Coffee treat")
  image: text('image'), // base64 encoded, compressed ~300KB
  status: itemStatusEnum('status').default('open').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Claims table (someone claims they found/lost the item)
export const claims = pgTable('claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  claimerId: uuid('claimer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(), // description of why they're claiming
  contactInfo: varchar('contact_info', { length: 255 }), // phone/location to meet
  status: claimStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
