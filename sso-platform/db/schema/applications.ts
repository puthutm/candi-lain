import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id").unique().notNull(),
  clientSecretHash: text("client_secret_hash").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
  allowedGrantTypes: jsonb("allowed_grant_types").$type<string[]>().default(["authorization_code", "refresh_token"]).notNull(),
  logoUrl: text("logo_url"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").default("active").notNull(), // "active" | "inactive"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scopes = pgTable("scopes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  description: text("description"),
});

export const applicationScopes = pgTable("application_scopes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  scopeId: uuid("scope_id").references(() => scopes.id, { onDelete: "cascade" }).notNull(),
});

// Relationships
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  owner: one(users, {
    fields: [applications.ownerUserId],
    references: [users.id],
  }),
  applicationScopes: many(applicationScopes),
}));

export const scopesRelations = relations(scopes, ({ many }) => ({
  applicationScopes: many(applicationScopes),
}));

export const applicationScopesRelations = relations(applicationScopes, ({ one }) => ({
  application: one(applications, {
    fields: [applicationScopes.applicationId],
    references: [applications.id],
  }),
  scope: one(scopes, {
    fields: [applicationScopes.scopeId],
    references: [scopes.id],
  }),
}));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Scope = typeof scopes.$inferSelect;
export type NewScope = typeof scopes.$inferInsert;
export type ApplicationScope = typeof applicationScopes.$inferSelect;
export type NewApplicationScope = typeof applicationScopes.$inferInsert;
