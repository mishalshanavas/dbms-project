import { pgTable, text, timestamp, varchar, boolean, uuid, pgEnum, unique } from 'drizzle-orm/pg-core'

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
  phone: varchar('phone', { length: 30 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Locations table
export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Items table (Losty listings)
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: itemTypeEnum('type').notNull(), // 'lost' or 'found'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  date: varchar('date', { length: 50 }).notNull(), // date when lost/found
  status: itemStatusEnum('status').default('open').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Item images table (optional)
export const itemImages = pgTable('item_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).unique().notNull(),
  imageData: text('image_data').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Rewards table (optional)
export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).unique().notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Claims table (someone claims they found/lost the item)
export const claims = pgTable('claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  claimerId: uuid('claimer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(), // description of why they're claiming
  status: claimStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  unq: unique().on(t.itemId, t.claimerId),
}))
