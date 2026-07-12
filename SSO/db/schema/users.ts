import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userStatusEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  usernameUnique: uniqueIndex("users_username_unique").on(table.username),
  emailUnique: uniqueIndex("users_email_unique").on(table.email),
}));

// Menampung identitas login eksternal (mis. Google/Microsoft) di fase federasi
// selanjutnya, tanpa perlu migrasi skema besar saat fitur itu diaktifkan.
export const userIdentities = pgTable("user_identities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // local | google | microsoft
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  providerUnique: uniqueIndex("user_identities_provider_unique").on(
    table.provider,
    table.providerUserId,
  ),
}));
