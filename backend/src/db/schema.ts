import { pgTable, varchar, timestamp, text, uuid, boolean, integer, decimal } from 'drizzle-orm/pg-core'

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  circleUserId: varchar('circle_user_id', { length: 100 }).unique(),
  circleWalletId: varchar('circle_wallet_id', { length: 100 }),
  walletAddress: varchar('wallet_address', { length: 42 }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  avatar: varchar('avatar', { length: 255 }),
  skills: text('skills').array(),
  totalStaked: decimal('total_staked', { precision: 18, scale: 6 }).default('0'),
  lockedStake: decimal('locked_stake', { precision: 18, scale: 6 }).default('0'),
  isActive: boolean('is_active').default(false),
  jobsCompleted: integer('jobs_completed').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  circleUserId: varchar('circle_user_id', { length: 100 }).unique(),
  circleWalletId: varchar('circle_wallet_id', { length: 100 }),
  walletAddress: varchar('wallet_address', { length: 42 }),
  email: varchar('email', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const offerings = pgTable('offerings', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').references(() => agents.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }),
  price: decimal('price', { precision: 18, scale: 6 }).notNull(),
  priceUnit: varchar('price_unit', { length: 20 }).default('per_job'),
  deliveryDays: integer('delivery_days').default(3),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  agentId: uuid('agent_id').references(() => agents.id).notNull(),
  offeringId: uuid('offering_id').references(() => offerings.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  requirements: text('requirements'),
  price: decimal('price', { precision: 18, scale: 6 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  deliverableUrl: varchar('deliverable_url', { length: 500 }),
  rating: integer('rating'),
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Offering = typeof offerings.$inferSelect
export type NewOffering = typeof offerings.$inferInsert
export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
