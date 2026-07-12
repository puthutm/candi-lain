import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { applications } from "./applications";
import { users } from "./users";

export const oauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 255 }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  redirectUri: varchar("redirect_uri", { length: 500 }).notNull(),
  scope: text("scope").notNull(), // space-separated, format standar OAuth2
  codeChallenge: varchar("code_challenge", { length: 255 }).notNull(),
  codeChallengeMethod: varchar("code_challenge_method", { length: 10 })
    .notNull()
    .default("S256"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  codeUnique: uniqueIndex("oauth_authorization_codes_code_unique").on(
    table.code,
  ),
}));

export const oauthAccessTokens = pgTable("oauth_access_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Simpan HASH token, bukan token mentah, untuk mitigasi kebocoran data.
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  revoked: boolean("revoked").notNull().default(false),
}, (table) => ({
  tokenHashUnique: uniqueIndex("oauth_access_tokens_hash_unique").on(
    table.tokenHash,
  ),
}));

export const oauthRefreshTokens = pgTable("oauth_refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  accessTokenId: uuid("access_token_id")
    .notNull()
    .references(() => oauthAccessTokens.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  tokenHashUnique: uniqueIndex("oauth_refresh_tokens_hash_unique").on(
    table.tokenHash,
  ),
  accessTokenUnique: uniqueIndex("oauth_refresh_tokens_access_token_unique")
    .on(table.accessTokenId),
}));

// Consent user terhadap scope yang diminta suatu aplikasi.
// Dipakai juga untuk fitur "lihat & cabut akses aplikasi" di profil user.
export const oauthConsents = pgTable("oauth_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => ({
  consentUnique: uniqueIndex("oauth_consents_unique").on(
    table.userId,
    table.applicationId,
  ),
}));
