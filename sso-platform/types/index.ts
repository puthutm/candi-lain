/**
 * Common types for SSO Platform
 */

// User status types
export type UserStatus = "active" | "inactive" | "locked";

// OAuth2 grant types
export type GrantType = "authorization_code" | "refresh_token" | "client_credentials";

// PKCE methods
export type PKCEMethod = "S256" | "plain";

// OAuth2 token types
export type TokenType = "Bearer";

// Application status
export type ApplicationStatus = "active" | "inactive";

// Role assignment status
export type RoleStatus = "active" | "revoked";

// Organization types
export type OrganizationType = "company" | "division" | "department";

// Audit action types
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "TOKEN_ISSUED"
  | "TOKEN_REVOKED"
  | "APPLICATION_CREATED"
  | "APPLICATION_UPDATED"
  | "ROLE_CREATED"
  | "ROLE_ASSIGNED"
  | "ROLE_REVOKED"
  | "CONSENT_GRANTED"
  | "CONSENT_REVOKED"
  | "REFERENCE_DATA_CREATED"
  | "REFERENCE_DATA_UPDATED"
  | "PASSWORD_CHANGED"
  | "SESSION_CREATED"
  | "SESSION_DESTROYED";

// Identity providers
export type IdentityProvider = "local" | "google" | "microsoft";

// Authentication errors
export type AuthError = 
  | "INVALID_CREDENTIALS"
  | "USER_INACTIVE"
  | "USER_LOCKED"
  | "MFA_REQUIRED";

// OAuth2 errors (RFC 6749)
export type OAuth2Error =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "invalid_scope"
  | "access_denied";

// Common result types
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Pagination types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Session types
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionValidationResult {
  valid: boolean;
  userId?: string;
  reason?: "EXPIRED" | "NOT_FOUND";
}
