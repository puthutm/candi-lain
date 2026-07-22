import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { applications } from "./applications";

export const oauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  redirectUri: text("redirect_uri").notNull(),
  scope: text("scope").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  codeChallengeMethod: text("code_challenge_method").notNull(), // "S256" | "plain"
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").unique().notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
    scope: text("scope").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_oauth_access_tokens_user_app").on(table.userId, table.applicationId),
  ]
);

export const oauthRefreshTokens = pgTable("oauth_refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").unique().notNull(),
  accessTokenId: uuid("access_token_id").references(() => oauthAccessTokens.id, { onDelete: "cascade" }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const oauthConsents = pgTable("oauth_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  scope: text("scope").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// Relationships
export const oauthAuthorizationCodesRelations = relations(oauthAuthorizationCodes, ({ one }) => ({
  user: one(users, {
    fields: [oauthAuthorizationCodes.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [oauthAuthorizationCodes.applicationId],
    references: [applications.id],
  }),
}));

export const oauthAccessTokensRelations = relations(oauthAccessTokens, ({ one, many }) => ({
  user: one(users, {
    fields: [oauthAccessTokens.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [oauthAccessTokens.applicationId],
    references: [applications.id],
  }),
  refreshTokens: many(oauthRefreshTokens),
}));

export const oauthRefreshTokensRelations = relations(oauthRefreshTokens, ({ one }) => ({
  accessToken: one(oauthAccessTokens, {
    fields: [oauthRefreshTokens.accessTokenId],
    references: [oauthAccessTokens.id],
  }),
}));

export const oauthConsentsRelations = relations(oauthConsents, ({ one }) => ({
  user: one(users, {
    fields: [oauthConsents.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [oauthConsents.applicationId],
    references: [applications.id],
  }),
}));

export type OAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferSelect;
export type NewOAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferInsert;
export type OAuthAccessToken = typeof oauthAccessTokens.$inferSelect;
export type NewOAuthAccessToken = typeof oauthAccessTokens.$inferInsert;
export type OAuthRefreshToken = typeof oauthRefreshTokens.$inferSelect;
export type NewOAuthRefreshToken = typeof oauthRefreshTokens.$inferInsert;
export type OAuthConsent = typeof oauthConsents.$inferSelect;
export type NewOAuthConsent = typeof oauthConsents.$inferInsert;
