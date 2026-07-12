import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { applicationStatusEnum } from "./enums";
import { users } from "./users";

// Inti dari "penambahan aplikasi dinamis": setiap baris di sini adalah satu
// OAuth2 client baru. Menambah aplikasi = insert row, bukan deploy ulang SSO.
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: varchar("client_id", { length: 100 }).notNull(),
  clientSecretHash: varchar("client_secret_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Disimpan sebagai JSON string, di-parse di application layer.
  // Contoh: '["https://app-a.company.com/callback"]'
  redirectUris: text("redirect_uris").notNull(),
  allowedGrantTypes: text("allowed_grant_types").notNull(), // '["authorization_code","refresh_token"]'
  logoUrl: varchar("logo_url", { length: 500 }),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  status: applicationStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  clientIdUnique: uniqueIndex("applications_client_id_unique").on(
    table.clientId,
  ),
}));

// Master scope global (openid, profile, email, erp:read, dst)
export const scopes = pgTable("scopes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull(),
  description: text("description"),
}, (table) => ({
  codeUnique: uniqueIndex("scopes_code_unique").on(table.code),
}));

// Scope apa saja yang boleh diminta oleh masing-masing aplikasi
export const applicationScopes = pgTable("application_scopes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  scopeId: uuid("scope_id")
    .notNull()
    .references(() => scopes.id, { onDelete: "cascade" }),
}, (table) => ({
  appScopeUnique: uniqueIndex("application_scopes_unique").on(
    table.applicationId,
    table.scopeId,
  ),
}));
