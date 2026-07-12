import { relations } from "drizzle-orm";
import { users, userIdentities } from "./users";
import { applications, scopes, applicationScopes } from "./applications";
import {
  applicationRoles,
  permissions,
  rolePermissions,
  userApplicationRoles,
} from "./rbac";
import {
  oauthAccessTokens,
  oauthRefreshTokens,
  oauthAuthorizationCodes,
  oauthConsents,
} from "./oauth";
import {
  refCategories,
  refItems,
  organizations,
  userOrganizations,
} from "./reference";
import { auditLogs } from "./audit";

// ============================================================================
// User Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  identities: many(userIdentities),
  applicationRoles: many(userApplicationRoles),
  consents: many(oauthConsents),
  organizations: many(userOrganizations),
  ownedApplications: many(applications),
  auditLogs: many(auditLogs),
  authorizationCodes: many(oauthAuthorizationCodes),
  accessTokens: many(oauthAccessTokens),
}));

export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, {
    fields: [userIdentities.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Application Relations
// ============================================================================

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  owner: one(users, {
    fields: [applications.ownerUserId],
    references: [users.id],
  }),
  scopes: many(applicationScopes),
  roles: many(applicationRoles),
  permissions: many(permissions),
  userRoles: many(userApplicationRoles),
  authorizationCodes: many(oauthAuthorizationCodes),
  accessTokens: many(oauthAccessTokens),
  consents: many(oauthConsents),
}));

export const scopesRelations = relations(scopes, ({ many }) => ({
  applications: many(applicationScopes),
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

// ============================================================================
// RBAC Relations
// ============================================================================

export const applicationRolesRelations = relations(applicationRoles, ({ one, many }) => ({
  application: one(applications, {
    fields: [applicationRoles.applicationId],
    references: [applications.id],
  }),
  rolePermissions: many(rolePermissions),
  userAssignments: many(userApplicationRoles),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  application: one(applications, {
    fields: [permissions.applicationId],
    references: [applications.id],
  }),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(applicationRoles, {
    fields: [rolePermissions.roleId],
    references: [applicationRoles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userApplicationRolesRelations = relations(userApplicationRoles, ({ one }) => ({
  user: one(users, {
    fields: [userApplicationRoles.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [userApplicationRoles.applicationId],
    references: [applications.id],
  }),
  role: one(applicationRoles, {
    fields: [userApplicationRoles.roleId],
    references: [applicationRoles.id],
  }),
  grantedByUser: one(users, {
    fields: [userApplicationRoles.grantedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// OAuth2 Relations
// ============================================================================

export const oauthAccessTokensRelations = relations(oauthAccessTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccessTokens.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [oauthAccessTokens.applicationId],
    references: [applications.id],
  }),
  refreshToken: one(oauthRefreshTokens, {
    fields: [oauthAccessTokens.id],
    references: [oauthRefreshTokens.accessTokenId],
  }),
}));

export const oauthRefreshTokensRelations = relations(oauthRefreshTokens, ({ one }) => ({
  accessToken: one(oauthAccessTokens, {
    fields: [oauthRefreshTokens.accessTokenId],
    references: [oauthAccessTokens.id],
  }),
}));

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

// ============================================================================
// Reference Data Relations
// ============================================================================

export const refCategoriesRelations = relations(refCategories, ({ many }) => ({
  items: many(refItems),
}));

export const refItemsRelations = relations(refItems, ({ one, many }) => ({
  category: one(refCategories, {
    fields: [refItems.categoryId],
    references: [refCategories.id],
  }),
  parent: one(refItems, {
    fields: [refItems.parentId],
    references: [refItems.id],
    relationName: "ref_item_parent",
  }),
  children: many(refItems, { relationName: "ref_item_parent" }),
  userPositions: many(userOrganizations),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: "organization_parent",
  }),
  children: many(organizations, { relationName: "organization_parent" }),
  members: many(userOrganizations),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
  position: one(refItems, {
    fields: [userOrganizations.positionRefItemId],
    references: [refItems.id],
  }),
}));

// ============================================================================
// Audit Log Relations
// ============================================================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));
