# Implementation Plan: SSO Platform

## Overview

This implementation plan breaks down the SSO Platform into incremental coding tasks. The platform is a comprehensive OAuth2 Identity Provider with dynamic client registration, dynamic role management, standalone reference data module, home dashboard portal, and admin consoles.

Tech stack: Next.js 14 (App Router), TypeScript, Drizzle ORM, PostgreSQL, JWT with RS256.

The implementation follows a layered approach:
1. Database schema and core infrastructure
2. Authentication and session management
3. OAuth2 flow with PKCE
4. Token management with JWT
5. Dynamic RBAC system
6. Reference data module
7. Admin consoles and UI components
8. Home dashboard portal
9. Integration and security hardening

## Tasks

- [ ] 1. Initialize project structure and database schema
  - [-] 1.1 Set up Next.js 14 project with TypeScript and App Router
    - Initialize Next.js project with TypeScript template
    - Configure tsconfig.json for strict type checking
    - Set up project structure: `/app`, `/lib`, `/components`, `/db`, `/types`
    - Install core dependencies: next, react, typescript, drizzle-orm, drizzle-kit, postgres, jose, bcrypt, zod, ioredis
    - Configure environment variables template (.env.example)
    - _Requirements: Foundation for all components_
  
  - [ ] 1.2 Define complete database schema with Drizzle ORM
    - Create schema files in `/db/schema/` for all tables:
      - users.ts: User, UserIdentity tables
      - applications.ts: Application, Scope, ApplicationScope tables
      - oauth.ts: OAuthAuthorizationCode, OAuthAccessToken, OAuthRefreshToken, OAuthConsent tables
      - rbac.ts: ApplicationRole, Permission, RolePermission, UserApplicationRole tables
      - reference.ts: RefCategory, RefItem, Organization, UserOrganization tables
      - audit.ts: AuditLog table
    - Define all relationships using Drizzle relations
    - Add database constraints: unique indexes, foreign keys, check constraints
    - Create drizzle.config.ts for migrations
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 10.1, 14.1, 17.1_

  
  - [~] 1.3 Generate and run database migrations
    - Use drizzle-kit to generate initial migration
    - Create database setup script
    - Run migrations against PostgreSQL database
    - Verify schema creation with database inspection
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 10.1, 14.1, 17.1_
  
  - [~] 1.4 Set up Redis connection and caching utilities
    - Configure Redis client (ioredis) with connection pooling
    - Create cache helper utilities: get, set, delete, TTL management
    - Implement session storage interface for Redis
    - Create audit event queue for asynchronous logging
    - _Requirements: 15.1, 17.4_

- [ ] 2. Implement Authentication Service
  - [~] 2.1 Implement password hashing and verification utilities
    - Create password hash function using bcrypt (10 rounds)
    - Create password verification function
    - Implement password policy validation: min 8 chars, letters, numbers, symbols
    - Create password comparison with timing-attack protection
    - _Requirements: 1.5, 1.6_
  
  - [~] 2.2 Implement user authentication logic
    - Create authenticate() function: validate username/password
    - Handle authentication result types: success with user, or failure with error code
    - Implement account status checks: active, inactive, locked
    - Add failed login attempt tracking (increment on failure)
    - Implement account locking after 5 failed attempts
    - _Requirements: 1.1, 1.2, 1.3, 23.3, 23.4_
  
  - [~] 2.3 Implement session management
    - Create session creation function: generate secure session ID, store in Redis
    - Create session validation function: check existence and expiration
    - Implement session destruction (logout)
    - Set session expiration: 24 hours default, configurable per client type
    - Add session metadata: user agent, IP address for anomaly detection
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  
  - [~] 2.4 Implement password change functionality
    - Create changePassword() function: verify current password, validate new password
    - Hash new password and update database
    - Invalidate all sessions except current one
    - Log password change event to audit log
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [~] 2.5 Write unit tests for authentication service
    - Test password hashing produces different hashes for same password (salt verification)
    - Test password verification with correct and incorrect passwords
    - Test authentication with valid credentials returns user
    - Test authentication with invalid credentials returns appropriate error
    - Test account locking after 5 failed attempts
    - Test session creation, validation, and destruction
    - _Requirements: 1.1, 1.2, 1.3, 15.1_

- [ ] 3. Implement OAuth2 Service with PKCE
  - [~] 3.1 Implement PKCE validation functions
    - Create validatePKCEChallenge() function for S256 method: compute BASE64URL(SHA256(verifier)), compare with challenge
    - Add support for plain method: direct comparison
    - Validate code_verifier length: 43-128 characters
    - Return boolean result with no side effects
    - _Requirements: 3.4, 3.5, 3.6_
  
  - [~] 3.2 Write property test for PKCE validation
    - **Property 2: PKCE Verification Property**
    - **Validates: Requirements 3.4, 3.5, 3.6**
    - Generate random code_verifier (43-128 chars)
    - Compute code_challenge using S256
    - Verify validatePKCEChallenge returns true for correct pair
    - Verify returns false for incorrect verifier
    - Test plain method as well
  
  - [~] 3.3 Implement authorization code creation
    - Create createAuthorizationCode() function
    - Generate cryptographically secure 64-character code
    - Validate redirect_uri against application's whitelist
    - Validate scope against application's allowed scopes
    - Store code with PKCE challenge, expiration (10 minutes), used flag (false)
    - _Requirements: 3.1, 3.2, 3.9_

  
  - [~] 3.4 Implement authorization code validation
    - Create validateAuthorizationCode() function
    - Check code exists in database
    - Verify code not already used
    - Verify code not expired (within 10 minutes)
    - Verify PKCE challenge matches verifier
    - Verify client_id and redirect_uri match
    - Return validation result with user and application context
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  
  - [~] 3.5 Write property test for authorization code single-use
    - **Property 1: Authorization Code Single-Use Property**
    - **Validates: Requirements 3.7**
    - Generate authorization code
    - First exchange should succeed
    - Second exchange with same code should throw error
    - Verify code marked as used in database
  
  - [~] 3.6 Implement authorization code exchange for tokens
    - Create exchangeCodeForTokens() function
    - Validate client credentials (client_id, client_secret)
    - Validate authorization code (reuse validation from 3.4)
    - Mark authorization code as used immediately
    - Fetch user roles for the application
    - Call Token Service to issue access, refresh, and ID tokens
    - Log TOKEN_ISSUED audit event
    - Return token response with all tokens and expiration
    - _Requirements: 3.4, 3.7, 4.1, 4.2, 4.3, 4.7_
  
  - [~] 3.7 Implement refresh token flow
    - Create refreshAccessToken() function
    - Validate refresh token: check not expired, not revoked
    - Validate client credentials
    - Issue new access token and new refresh token (rotation)
    - Revoke old refresh token
    - Update user roles in new ID token (may have changed)
    - _Requirements: 4.9_

  
  - [~] 3.8 Write unit tests for OAuth2 service
    - Test authorization code generation produces unique codes
    - Test redirect URI validation against whitelist
    - Test authorization code expiration after 10 minutes
    - Test code exchange with invalid client credentials fails
    - Test code exchange with mismatched redirect URI fails
    - _Requirements: 3.1, 3.7, 3.8, 3.9_

- [~] 4. Checkpoint - Core authentication and OAuth2 foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Token Service with JWT
  - [~] 5.1 Set up RS256 key pair generation and storage
    - Generate RSA key pair (2048-bit) for JWT signing
    - Store private key securely (environment variable or secrets manager)
    - Store public key for JWKS endpoint
    - Implement key rotation support: add new key before removing old
    - Create key ID (kid) for key identification
    - _Requirements: 4.4, 4.8_
  
  - [~] 5.2 Implement JWT generation functions
    - Create generateAccessToken(): issue JWT with RS256, 1-hour expiration
    - Include standard claims: sub (user ID), aud (client_id), scope, exp, iat, jti
    - Create generateIdToken(): include user profile (sub, email, name, preferred_username) and roles
    - Create generateRefreshToken(): generate opaque token (32-char random)
    - Implement token signing with private key using jose library
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [~] 5.3 Implement token verification and introspection
    - Create verifyAccessToken(): verify JWT signature using public key
    - Check token expiration
    - Check token not revoked (query token hash in database)
    - Create introspectToken(): return token status and metadata for resource servers
    - Return null for invalid/expired/revoked tokens
    - _Requirements: 4.5, 4.6, 22.1, 22.2, 22.3, 22.4_
  
  - [~] 5.4 Write property test for token expiration
    - **Property 4: Token Expiration Property**
    - **Validates: Requirements 4.1**
    - Generate access token with various expiration times
    - Mock system time to after expiration
    - Verify verifyAccessToken() returns null for all expired tokens
    - Verify returns valid payload for non-expired tokens

  
  - [~] 5.5 Implement token revocation
    - Create revokeAccessToken(): update token record, set revoked = true
    - Create revokeRefreshToken(): revoke refresh token and associated access token
    - Log TOKEN_REVOKED audit event
    - Implement cascade revocation: when refresh token revoked, revoke access token too
    - _Requirements: 4.6, 4.10, 9.6_
  
  - [~] 5.6 Implement user info endpoint logic
    - Create getUserInfo(): extract user ID from access token
    - Verify token valid and not revoked
    - Fetch user profile from database
    - Fetch active roles for requesting application only
    - Return user info with scoped roles
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 27.2, 27.3, 27.4_
  
  - [~] 5.7 Implement JWKS endpoint
    - Create getJWKS(): return public key in JWK format
    - Include kid, kty (RSA), use (sig), alg (RS256), n (modulus), e (exponent)
    - Support multiple keys for rotation (keys array)
    - Set Cache-Control headers for CDN caching (1 hour TTL)
    - _Requirements: 4.8_
  
  - [~] 5.8 Write unit tests for token service
    - Test JWT generation produces valid tokens with correct claims
    - Test token verification with valid signature succeeds
    - Test token verification with invalid signature fails
    - Test token verification with expired token fails
    - Test revoked token fails verification
    - Test user info returns correct roles for requesting application
    - _Requirements: 4.1, 4.3, 4.6, 8.1, 8.2_

- [ ] 6. Implement Dynamic RBAC Service
  - [~] 6.1 Implement role management functions
    - Create createRole(): validate role_key unique per application, alphanumeric + underscore only
    - Create updateRole(): allow modifying display name, description, isDefault flag
    - Create deleteRole(): soft delete, prevent if users assigned
    - Create getRolesByApplication(): return all roles for an application
    - _Requirements: 6.1, 6.2, 6.3_

  
  - [~] 6.2 Implement permission management functions
    - Create createPermission(): validate permission_key unique per application, "resource:action" format
    - Create deletePermission(): remove permission and all role associations
    - Create assignPermissionToRole(): create role_permission record
    - Create removePermissionFromRole(): delete role_permission record
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [~] 6.3 Implement user role assignment functions
    - Create assignRoleToUser(): validate role belongs to application, check admin permission
    - Check for existing assignment: if revoked, reactivate; if active, throw error
    - Store grantedBy admin user ID and timestamp
    - Log ROLE_ASSIGNED audit event
    - Create revokeRoleFromUser(): update status to "revoked", log ROLE_REVOKED
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [~] 6.4 Implement role query functions
    - Create getUserRoles(): fetch active roles for user + application, ordered by grantedAt
    - Create getUserPermissions(): aggregate permissions from all user's active roles
    - Return empty array if no roles/permissions
    - _Requirements: 6.8, 7.5, 27.1_
  
  - [~] 6.5 Write property test for role isolation
    - **Property 3: Role Isolation Property**
    - **Validates: Requirements 6.1, 27.1, 27.2, 27.3**
    - Create role in application A
    - Query roles for application B
    - Verify role from A never appears in B's context
    - Test with multiple applications and roles
  
  - [~] 6.6 Write property test for role assignment authorization
    - **Property 5: Role Assignment Authorization Property**
    - **Validates: Requirements 6.4**
    - Attempt role assignment with Super Admin - should succeed
    - Attempt role assignment with App Owner for their app - should succeed
    - Attempt role assignment with non-admin user - should fail
    - Attempt role assignment with App Owner for different app - should fail

  
  - [~] 6.7 Write unit tests for RBAC service
    - Test role creation with duplicate role_key fails
    - Test role creation with invalid role_key format fails
    - Test permission creation with invalid format fails
    - Test role assignment to user creates active record
    - Test duplicate role assignment fails
    - Test role revocation updates status
    - Test getUserRoles returns only active roles
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.8_

- [~] 7. Checkpoint - Token and RBAC systems complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Reference Data Service
  - [~] 8.1 Implement category management functions
    - Create createCategory(): validate code unique, uppercase, alphanumeric + underscore
    - Create updateCategory(): allow modifying name and description, not code
    - Create deleteCategory(): prevent deletion if category has active items
    - Create getCategories(): return all categories ordered by creation date
    - Create getCategoryByCode(): fetch single category by code
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [~] 8.2 Implement item management functions
    - Create createItem(): validate code unique within category, validate parent belongs to same category
    - Create updateItem(): allow modifying all fields except category ID
    - Create deleteItem(): soft delete, set isActive = false
    - Validate extraValue JSON size <= 10KB
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_
  
  - [~] 8.3 Implement hierarchical query functions
    - Create getItemsByCategory(): return active items ordered by sortOrder
    - Create getItemHierarchy(): build tree structure recursively
    - Start with root items (parentId = null), recursively fetch children
    - Return tree with parent-child relationships intact
    - _Requirements: 11.6, 11.7_

  
  - [~] 8.4 Write property test for reference data isolation
    - **Property 8: Reference Data Isolation Property**
    - **Validates: Requirements 11.1, 11.6**
    - Create items in category A
    - Query category B
    - Verify items from A never appear in B's results
    - Test hierarchical queries as well
  
  - [~] 8.5 Implement organization management functions
    - Create createOrganization(): validate code unique, validate parent exists
    - Create updateOrganization(): allow modifying name, parent, type
    - Create getOrganizationHierarchy(): build tree structure for all units
    - Prevent circular references in parent-child relationships
    - _Requirements: 14.1, 14.2, 14.3, 14.7_
  
  - [~] 8.6 Implement user-organization assignment
    - Create assignUserToOrganization(): link user to org unit
    - Allow optional position reference (link to JABATAN category item)
    - Enforce only one primary organization per user
    - _Requirements: 14.4, 14.5, 14.6_
  
  - [~] 8.7 Write unit tests for reference data service
    - Test category creation with duplicate code fails
    - Test item creation with parent from different category fails
    - Test item hierarchy returns correct tree structure
    - Test circular reference prevention in organizations
    - Test user can have only one primary organization
    - _Requirements: 10.1, 11.2, 14.2, 14.6_

- [ ] 9. Implement Audit Service
  - [~] 9.1 Implement audit logging functions
    - Create log(): accept AuditEvent, write to Redis queue (non-blocking)
    - Create audit worker: consume queue, batch-insert to database
    - Support all action types: LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, TOKEN_ISSUED, TOKEN_REVOKED, APPLICATION_CREATED, etc.
    - Store metadata as JSON for flexible context
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  
  - [~] 9.2 Implement audit query functions
    - Create query(): support filtering by actor, action, entity type, entity ID, date range
    - Support pagination: limit and offset parameters
    - Create getRecentActivity(): fetch recent logs for specific user
    - Add database indexes: (actorUserId), (action), (entityType, entityId), (createdAt)
    - _Requirements: 17.8_
  
  - [~] 9.3 Write property test for audit immutability
    - **Property 9: Audit Immutability Property**
    - **Validates: Requirements 17.7**
    - Create audit log entry
    - Attempt to update entry - should fail/not be allowed
    - Attempt to delete entry - should fail/not be allowed
    - Verify entry remains unchanged
  
  - [~] 9.4 Write unit tests for audit service
    - Test audit log entry created with all required fields
    - Test audit worker processes queue and inserts to database
    - Test query with filters returns correct results
    - Test pagination works correctly
    - _Requirements: 17.1, 17.5, 17.8_

- [ ] 10. Implement Dynamic Client Registration
  - [~] 10.1 Implement application management functions
    - Create createApplication(): generate unique 24-char client_id, generate 32-char client_secret
    - Display client_secret once, store only bcrypt hash
    - Validate redirect URIs: HTTPS URLs or http://localhost
    - Set default allowed grant types: authorization_code, refresh_token
    - Assign minimal scopes: openid, profile
    - Log APPLICATION_CREATED audit event
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 20.3_
  
  - [~] 10.2 Implement application update and status management
    - Create updateApplication(): allow modifying name, description, redirect URIs, logo
    - Create activateApplication() / deactivateApplication(): update status without deletion
    - Log APPLICATION_UPDATED audit event
    - _Requirements: 5.6, 5.7_

  
  - [~] 10.3 Implement client secret rotation
    - Create rotateClientSecret(): generate new 32-char secret, store new hash
    - Display new secret once
    - Invalidate old secret immediately
    - Log secret rotation in audit
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  
  - [~] 10.4 Write property test for redirect URI whitelist
    - **Property 6: Redirect URI Whitelist Property**
    - **Validates: Requirements 3.9, 5.5**
    - Generate random redirect URI not in application's whitelist
    - Attempt authorization with that URI
    - Verify authorization fails
    - Test with URI in whitelist succeeds
  
  - [~] 10.5 Write unit tests for application management
    - Test client_id generation produces unique IDs
    - Test client_secret is 32 characters and cryptographically random
    - Test client_secret hash verification succeeds with correct secret
    - Test redirect URI validation rejects non-HTTPS except localhost
    - Test secret rotation generates new secret and invalidates old
    - _Requirements: 5.1, 5.2, 5.5, 21.1_

- [ ] 11. Implement Consent Management
  - [~] 11.1 Implement consent storage and validation
    - Create grantConsent(): store consent with application, user, scopes, timestamp
    - Create hasActiveConsent(): check if user has granted consent for application + scopes
    - Create revokeConsent(): update consent with revokedAt timestamp
    - Cascade token revocation when consent revoked
    - Log CONSENT_GRANTED and CONSENT_REVOKED audit events
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7_
  
  - [~] 11.2 Implement consent query functions
    - Create getUserConsents(): return all applications with active consent for user
    - Include application name, logo, granted scopes, grant date
    - Filter out revoked consents
    - _Requirements: 9.4, 9.5_

  
  - [~] 11.3 Write unit tests for consent management
    - Test consent grant creates record with correct scopes
    - Test hasActiveConsent returns true for granted consent
    - Test hasActiveConsent returns false after revocation
    - Test token revocation cascades when consent revoked
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

- [~] 12. Checkpoint - Core backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement OAuth2 Public API Endpoints
  - [~] 13.1 Implement /oauth/authorize endpoint (GET)
    - Parse query parameters: client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, response_type
    - Validate client_id exists and is active
    - Validate redirect_uri in whitelist
    - Validate scopes allowed for application
    - Check user session: if not logged in, redirect to login page
    - Check consent: if not granted, show consent screen
    - Generate authorization code and redirect to client callback
    - _Requirements: 3.1, 3.2, 9.1_
  
  - [~] 13.2 Implement /oauth/token endpoint (POST)
    - Parse form parameters: grant_type, code, code_verifier, client_id, client_secret, redirect_uri (for authorization_code)
    - Parse form parameters: grant_type, refresh_token, client_id, client_secret (for refresh_token)
    - Validate client credentials
    - For authorization_code: call OAuth2Service.exchangeCodeForTokens()
    - For refresh_token: call OAuth2Service.refreshAccessToken()
    - Return token response with access_token, refresh_token, id_token, expires_in
    - Handle errors per RFC 6749 format
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 4.9, 24.1_
  
  - [~] 13.3 Implement /oauth/userinfo endpoint (GET)
    - Extract Bearer token from Authorization header
    - Verify token using TokenService.verifyAccessToken()
    - Call TokenService.getUserInfo() to get profile and roles
    - Return user info JSON
    - Handle 401 errors for invalid/expired/revoked tokens
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 24.3_

  
  - [~] 13.4 Implement /oauth/introspect endpoint (POST)
    - Require client authentication
    - Parse token parameter
    - Call TokenService.introspectToken()
    - Return introspection response with active status and metadata
    - _Requirements: 4.5, 22.1, 22.2, 22.3, 22.4, 22.5_
  
  - [~] 13.5 Implement /oauth/revoke endpoint (POST)
    - Require client authentication
    - Parse token and token_type_hint parameters
    - Call TokenService.revokeAccessToken() or revokeRefreshToken()
    - Return 200 OK (no content)
    - _Requirements: 4.6_
  
  - [~] 13.6 Implement /.well-known/jwks.json endpoint (GET)
    - Call TokenService.getJWKS()
    - Return JWKS JSON with public keys
    - Set Cache-Control header: public, max-age=3600
    - _Requirements: 4.8_
  
  - [~] 13.7 Implement /.well-known/openid-configuration endpoint (GET)
    - Return OIDC discovery document with all endpoint URLs
    - Include issuer, authorization_endpoint, token_endpoint, userinfo_endpoint, jwks_uri, etc.
    - Include supported grant types, response types, scopes, token signing algorithms
    - _Requirements: Foundation for OIDC compliance_
  
  - [~] 13.8 Write integration tests for OAuth2 endpoints
    - Test complete authorization code flow from /authorize to /token to /userinfo
    - Test PKCE validation in token exchange
    - Test refresh token flow
    - Test token introspection returns correct metadata
    - Test token revocation makes token inactive
    - _Requirements: 3.1, 3.4, 4.9, 22.1_


- [ ] 14. Implement Reference Data Public API Endpoints
  - [~] 14.1 Implement /api/reference/:categoryCode endpoint (GET)
    - Parse categoryCode parameter
    - Query ReferenceService.getCategoryByCode()
    - If hierarchy requested (query param), call getItemHierarchy()
    - Otherwise call getItemsByCategory()
    - Return JSON with category info and items
    - Return 404 for non-existent category
    - No authentication required (public endpoint)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [~] 14.2 Write integration tests for reference data API
    - Test fetch category items returns active items only
    - Test hierarchical query returns tree structure
    - Test non-existent category returns 404
    - Test public access (no auth required)
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 15. Implement Admin API Endpoints for Applications
  - [~] 15.1 Implement /api/admin/applications endpoints (CRUD)
    - POST /api/admin/applications: create application (Super Admin only)
    - GET /api/admin/applications: list all applications (Super Admin only)
    - GET /api/admin/applications/:id: get application details (Super Admin, App Owner)
    - PUT /api/admin/applications/:id: update application (Super Admin, App Owner)
    - DELETE /api/admin/applications/:id: soft delete application (Super Admin only)
    - Validate permissions before each operation
    - Return 403 for unauthorized access
    - _Requirements: 5.1, 5.2, 5.6, 18.2, 18.3, 18.4_
  
  - [~] 15.2 Implement /api/admin/applications/:id/roles endpoints
    - GET: list roles for application (Super Admin, App Owner)
    - POST: create new role (Super Admin, App Owner)
    - PUT /:roleId: update role (Super Admin, App Owner)
    - DELETE /:roleId: delete role (Super Admin, App Owner)
    - Call RBACService functions with permission checks
    - _Requirements: 6.1, 6.2, 6.3, 18.5, 19.3_

  
  - [~] 15.3 Implement /api/admin/applications/:id/users endpoints
    - GET: list user role assignments for application (Super Admin, App Owner)
    - POST: assign role to user (Super Admin, App Owner)
    - DELETE /:userId/roles/:roleId: revoke role from user (Super Admin, App Owner)
    - Include user search functionality in response
    - _Requirements: 6.4, 6.5, 19.4, 19.5_
  
  - [~] 15.4 Implement /api/admin/scopes endpoints
    - GET /api/admin/scopes: list all scopes (Super Admin)
    - POST /api/admin/scopes: create new scope (Super Admin)
    - Ensure default scopes (openid, profile, email) always exist
    - _Requirements: 20.1, 20.2, 20.3, 20.4_
  
  - [~] 15.5 Write integration tests for admin API
    - Test Super Admin can create application
    - Test App Owner can manage only their application
    - Test App Owner cannot access other applications
    - Test role assignment by App Owner succeeds
    - Test role assignment by non-admin fails with 403
    - _Requirements: 5.1, 18.1, 19.1, 19.2_

- [ ] 16. Implement Admin API Endpoints for Reference Data
  - [~] 16.1 Implement /api/admin/reference/categories endpoints
    - GET: list all categories (Super Admin)
    - POST: create new category (Super Admin)
    - PUT /:id: update category (Super Admin)
    - DELETE /:id: delete category if no active items (Super Admin)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 13.3_
  
  - [~] 16.2 Implement /api/admin/reference/categories/:id/items endpoints
    - GET: list items in category (Super Admin)
    - POST: create new item with validation (Super Admin)
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [~] 16.3 Implement /api/admin/reference/items/:id endpoints
    - PUT: update item (Super Admin)
    - DELETE: soft delete item (Super Admin)
    - _Requirements: 11.4, 11.5_

  
  - [~] 16.4 Implement /api/admin/organizations endpoints
    - GET: list all organizations hierarchically (Super Admin)
    - POST: create new organization (Super Admin)
    - PUT /:id: update organization (Super Admin)
    - _Requirements: 14.1, 14.2, 14.3, 14.7_
  
  - [~] 16.5 Implement /api/admin/users/:userId/organizations endpoints
    - GET: get user's organizations (Super Admin, self)
    - POST: assign user to organization (Super Admin)
    - _Requirements: 14.4, 14.5, 14.6_
  
  - [~] 16.6 Write integration tests for reference admin API
    - Test category creation with unique code
    - Test category deletion fails if items exist
    - Test item creation with parent validation
    - Test organization hierarchy query
    - Test user can have only one primary organization
    - _Requirements: 10.1, 10.4, 11.2, 14.6_

- [ ] 17. Implement Audit Log API Endpoints
  - [~] 17.1 Implement /api/admin/audit endpoints
    - GET: query audit logs with filters (actor, action, entity, date range)
    - Support pagination (limit, offset)
    - Return audit log entries ordered by createdAt descending
    - Super Admin only
    - _Requirements: 17.8_
  
  - [~] 17.2 Implement /api/admin/audit/users/:userId endpoint
    - GET: get activity history for specific user
    - Super Admin or user themselves can access
    - Return recent activity with limit
    - _Requirements: 17.8_
  
  - [~] 17.3 Write integration tests for audit API
    - Test audit query with filters returns correct results
    - Test pagination works correctly
    - Test user can access their own activity
    - Test user cannot access other users' activity
    - _Requirements: 17.8_


- [~] 18. Checkpoint - All API endpoints implemented
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Implement Login and Consent UI Pages
  - [~] 19.1 Create login page (/login)
    - Design responsive login form with username and password fields
    - Add client-side validation
    - Submit to authentication endpoint
    - Handle errors: display error messages for invalid credentials, locked accounts
    - Redirect to original requested URL after successful login
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [~] 19.2 Create consent page (/oauth/consent)
    - Display application name, logo, and description
    - Show requested scopes with user-friendly descriptions
    - Add "Allow" and "Deny" buttons
    - On allow: grant consent and redirect with authorization code
    - On deny: redirect with error
    - _Requirements: 9.1, 9.2, 20.5_
  
  - [~] 19.3 Create logout page and functionality
    - Implement logout endpoint that destroys session
    - Create logout confirmation page
    - Redirect to login after logout
    - _Requirements: 15.5_
  
  - [~] 19.4 Write UI integration tests for login and consent
    - Test login with valid credentials succeeds
    - Test login with invalid credentials shows error
    - Test consent grant creates consent record
    - Test consent deny returns error to client
    - _Requirements: 1.1, 9.1, 9.2_

- [ ] 20. Implement Home Dashboard Portal
  - [~] 20.1 Create Home Dashboard page (/home)
    - Fetch all applications where user has active roles
    - Display applications in responsive grid layout
    - Show application name, logo, description for each app
    - Add greeting with user's full name and time-based message
    - Handle empty state: display message when user has no app access
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  
  - [~] 20.2 Implement application card click handler
    - When user clicks on application card, initiate OAuth2 authorization flow
    - Redirect to /oauth/authorize with application's client_id and redirect_uri
    - Include state parameter for security
    - _Requirements: 2.4_
  
  - [~] 20.3 Write UI tests for Home Dashboard
    - Test dashboard displays applications with user roles
    - Test dashboard shows empty state when no roles
    - Test greeting message includes user name
    - Test clicking application initiates OAuth2 flow
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 21. Implement Admin Console UI for Super Admin
  - [~] 21.1 Create Admin Console dashboard page (/admin)
    - Display navigation: Applications, Scopes, Audit Logs, Reference Data
    - Show summary statistics: total applications, total users, recent activity
    - Restrict access to Super Admin only
    - _Requirements: 18.1_
  
  - [~] 21.2 Create application management pages
    - List page: display all applications with name, client_id, status, owner
    - Create page: form for application creation, display generated client_secret once
    - Detail page: show application details, redirect URIs, scopes, role statistics
    - Edit page: form for updating application details
    - _Requirements: 18.2, 18.3, 18.4_
  
  - [~] 21.3 Create scope management pages
    - List page: display all scopes with descriptions
    - Create page: form for creating new scope
    - _Requirements: 18.5, 20.1, 20.2_
  
  - [~] 21.4 Create audit log viewer page
    - Display audit logs with filtering options
    - Support filters: actor, action, entity type, date range
    - Implement pagination
    - Export functionality (CSV)
    - _Requirements: 17.8_

  
  - [~] 21.5 Write UI tests for Admin Console
    - Test Super Admin can access all sections
    - Test application creation displays client_secret once
    - Test scope creation succeeds
    - Test audit log filtering works correctly
    - _Requirements: 18.1, 18.2, 18.3, 20.1_

- [ ] 22. Implement App Owner Console UI
  - [~] 22.1 Create App Owner dashboard page (/admin/my-apps)
    - Display only applications owned by current user
    - Show application cards with role management links
    - Restrict visibility to owned applications only
    - _Requirements: 19.1, 19.2_
  
  - [~] 22.2 Create role management pages for App Owner
    - List page: display roles for selected application
    - Create page: form for creating new role with role_key validation
    - Edit page: form for updating role
    - Delete page: confirmation dialog before deletion
    - _Requirements: 19.3_
  
  - [~] 22.3 Create user assignment pages
    - List page: display users with assigned roles for application
    - Assignment page: user search + role selection dropdown
    - Show grant date and granting admin
    - Revoke button for each assignment
    - _Requirements: 19.4, 19.5_
  
  - [~] 22.4 Write UI tests for App Owner Console
    - Test App Owner sees only their applications
    - Test App Owner cannot access other applications
    - Test role creation with validation
    - Test user assignment succeeds
    - Test role revocation works
    - _Requirements: 19.1, 19.2, 19.3, 19.4_


- [ ] 23. Implement Reference Data Admin Console UI
  - [~] 23.1 Create Reference Admin Console dashboard (/admin/reference)
    - Standalone interface separate from SSO Admin Console
    - Display navigation: Categories, Organizations
    - Show summary: total categories, total items, total organizations
    - Super Admin only
    - _Requirements: 13.1, 13.2_
  
  - [~] 23.2 Create category management pages
    - List page: display categories with code, name, item count
    - Create page: form for category creation
    - Edit page: form for updating category (code not editable)
    - Detail page: show items in category
    - _Requirements: 13.3, 13.4_
  
  - [~] 23.3 Create item management pages
    - List page: display items hierarchically with indentation
    - Create page: form for item creation with parent selection
    - Edit page: form with all fields including JSON editor for extraValue
    - Hierarchical tree view for better visualization
    - _Requirements: 13.4, 13.5_
  
  - [~] 23.4 Create organization management pages
    - List page: display organizations in tree structure
    - Create page: form for organization creation with parent selection
    - Edit page: form for updating organization
    - Visual tree diagram for organization hierarchy
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [~] 23.5 Write UI tests for Reference Admin Console
    - Test category creation and listing
    - Test item creation with parent validation
    - Test hierarchical display shows correct structure
    - Test organization tree visualization
    - _Requirements: 13.3, 13.4, 14.1_

- [~] 24. Checkpoint - All UI components complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 25. Implement Security Controls and Performance Optimizations
  - [~] 25.1 Implement rate limiting
    - Add rate limiting middleware on /oauth/token endpoint: max 10 requests/minute per client
    - Add rate limiting on /login endpoint: max 5 attempts/minute per IP
    - Use Redis for distributed rate limiting
    - Return 429 Too Many Requests when limit exceeded
    - _Requirements: 23.2_
  
  - [~] 25.2 Implement security headers
    - Set HSTS: Strict-Transport-Security header
    - Set X-Frame-Options: DENY
    - Set Content-Security-Policy
    - Set X-Content-Type-Options: nosniff
    - Add middleware to apply headers to all responses
    - _Requirements: 23.1, 23.7_
  
  - [~] 25.3 Implement caching strategy
    - Cache JWKS response with 1-hour TTL (Redis or CDN)
    - Cache reference data queries with 1-hour TTL, invalidate on updates
    - Cache organization hierarchy with 1-hour TTL
    - Set appropriate Cache-Control headers
    - _Requirements: 25.2, 25.3_
  
  - [~] 25.4 Optimize database queries
    - Add indexes on frequently queried columns:
      - oauth_authorization_codes(code)
      - oauth_access_tokens(tokenHash)
      - user_application_roles(userId, applicationId, status)
      - ref_items(categoryId, isActive, sortOrder)
      - audit_logs(actorUserId, action, createdAt)
    - Use JOINs to avoid N+1 queries when fetching user roles
    - Implement connection pooling (max 20 connections)
    - _Requirements: 25.1, 25.4_
  
  - [~] 25.5 Write performance tests
    - Test token endpoint responds within 300ms at p95
    - Test Home Dashboard loads within 500ms
    - Test reference data API responds within 200ms
    - Test audit log query responds within 1 second for 30-day range
    - _Requirements: 25.1, 25.2, 25.4, 25.5_


- [ ] 26. Implement Error Handling and Validation
  - [~] 26.1 Implement comprehensive error handling
    - Create error middleware for consistent error responses
    - OAuth2 errors follow RFC 6749 format (error, error_description)
    - Validation errors return 400 with field-level details
    - Authentication errors return 401 with WWW-Authenticate header
    - Authorization errors return 403 with description
    - Not found errors return 404
    - Server errors return 500 and log for investigation
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_
  
  - [~] 26.2 Implement input validation with Zod
    - Create Zod schemas for all API endpoints
    - Validate request body, query parameters, path parameters
    - Return detailed validation errors
    - Sanitize inputs to prevent injection attacks
    - _Requirements: 24.2_
  
  - [~] 26.3 Write tests for error handling
    - Test invalid PKCE returns correct error
    - Test expired authorization code returns error
    - Test replay attack triggers code revocation and error
    - Test invalid credentials return appropriate error
    - Test permission denied returns 403
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [ ] 27. Implement Data Retention and Archival
  - [~] 27.1 Implement audit log archival
    - Create scheduled job to archive logs older than 1 year
    - Export to cold storage (AWS S3 or local filesystem)
    - Keep primary database logs < 1 year
    - _Requirements: 26.1, 26.2_
  
  - [~] 27.2 Implement token cleanup
    - Create scheduled job to delete revoked token records older than 90 days
    - Keep active tokens and recent revoked tokens only
    - _Requirements: 26.3_

  
  - [~] 27.3 Implement soft delete for deactivated entities
    - Retain deactivated user accounts indefinitely with audit trail
    - Retain deactivated application configurations indefinitely
    - Implement isActive flags and filter queries accordingly
    - _Requirements: 26.4, 26.5_
  
  - [~] 27.4 Write tests for data retention
    - Test audit logs older than 1 year are archived
    - Test revoked tokens older than 90 days are deleted
    - Test deactivated users retain audit trail
    - _Requirements: 26.1, 26.3, 26.4_

- [ ] 28. Implement Scope Management
  - [~] 28.1 Create default scopes
    - Seed database with default scopes: openid, profile, email
    - Ensure all applications have these scopes by default
    - _Requirements: 20.3_
  
  - [~] 28.2 Implement scope validation in authorization flow
    - Validate requested scopes against application's allowed scopes
    - Reject authorization if unknown scope requested
    - Display scope descriptions in consent screen
    - _Requirements: 20.4, 20.5_
  
  - [~] 28.3 Write property test for scope limitation
    - **Property 7: Scope Limitation Property**
    - **Validates: Requirements 20.4**
    - Request scopes not assigned to application
    - Verify authorization fails
    - Request only assigned scopes
    - Verify authorization succeeds
    - Verify issued token contains only requested scopes

- [ ] 29. Implement Session Validity and Security
  - [~] 29.1 Implement session validation for authenticated requests
    - Create middleware to validate session on protected routes
    - Check session exists and not expired
    - Tie session to user agent and IP for anomaly detection
    - Force re-authentication for sensitive operations
    - _Requirements: 15.3, 15.4, 23.5_

  
  - [~] 29.2 Implement secure cookie configuration
    - Set Secure flag (HTTPS only)
    - Set HttpOnly flag (prevent JavaScript access)
    - Set SameSite=Lax (CSRF protection)
    - Configure appropriate expiration
    - _Requirements: 23.5_
  
  - [~] 29.3 Write property test for session validity
    - **Property 10: Session Validity Property**
    - **Validates: Requirements 15.3**
    - Make authenticated request with valid session - should succeed
    - Make authenticated request with expired session - should fail
    - Make authenticated request without session - should fail
    - Verify all successful requests have valid session

- [ ] 30. Integration and End-to-End Testing
  - [~] 30.1 Write end-to-end OAuth2 flow test
    - Simulate complete flow: login → consent → authorization code → token exchange → userinfo
    - Verify all steps complete successfully
    - Verify tokens contain correct claims and roles
    - Verify PKCE validation throughout
    - _Requirements: 1.1, 3.1, 4.1, 8.1_
  
  - [~] 30.2 Write end-to-end dynamic role management test
    - Super Admin creates application
    - App Owner creates role for application
    - App Owner assigns role to user
    - User performs OAuth2 login
    - Verify ID token contains new role
    - App Owner revokes role
    - User refreshes token
    - Verify new ID token does not contain revoked role
    - _Requirements: 5.1, 6.1, 6.4, 6.5, 4.9, 27.2_
  
  - [~] 30.3 Write end-to-end reference data flow test
    - Super Admin creates category "JABATAN"
    - Super Admin creates hierarchical items
    - Client app queries /api/reference/JABATAN
    - Verify correct tree structure returned
    - Test cross-application access (two different apps query same data)
    - _Requirements: 10.1, 11.1, 12.1, 12.2_

  
  - [~] 30.4 Write token revocation cascade test
    - User has active access token and refresh token
    - Admin revokes user's consent for application
    - Verify both tokens fail verification
    - Verify audit log records revocation
    - _Requirements: 9.6, 4.6, 17.2_
  
  - [~] 30.5 Write Home Dashboard integration test
    - User logs in
    - User is redirected to Home Dashboard
    - Dashboard displays applications with user's roles
    - User clicks on application
    - OAuth2 flow initiates for that application
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [~] 31. Final Checkpoint - Complete system integration verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 32. Documentation and Deployment Preparation
  - [~] 32.1 Create API documentation
    - Document all OAuth2 endpoints with examples
    - Document admin API endpoints with authentication requirements
    - Document reference data API endpoints
    - Include example requests and responses
    - Add CURL examples for testing
  
  - [~] 32.2 Create deployment guide
    - Document environment variables required
    - Document database setup and migration steps
    - Document Redis setup
    - Document RS256 key pair generation
    - Include Docker Compose example for local development
    - Include production deployment considerations (Kubernetes, AWS ECS)
  
  - [~] 32.3 Create developer integration guide
    - Document how client applications integrate with SSO
    - Provide code examples for OAuth2 flow in multiple languages (TypeScript, Python, Java)
    - Document PKCE implementation requirements
    - Document token verification using JWKS
    - Document role-based authorization patterns

  
  - [~] 32.4 Create admin user guide
    - Document how to use Admin Console
    - Document how to create and manage applications
    - Document how to manage roles and assign to users
    - Document how to use Reference Data Admin Console
    - Include screenshots and step-by-step instructions
  
  - [~] 32.5 Set up monitoring and logging
    - Configure structured logging (JSON format)
    - Set up log aggregation (CloudWatch, Loki, or similar)
    - Configure metrics export (Prometheus format)
    - Set up health check endpoint (/api/health)
    - Document alerting rules for production

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Checkpoints ensure incremental validation at key milestones
- The implementation is layered: infrastructure → backend services → APIs → UI → integration
- All security controls (rate limiting, headers, encryption) are implemented before deployment
- Performance optimizations (caching, indexing) are included to meet SLA requirements


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1", "5.2"] },
    { "id": 4, "tasks": ["2.4", "2.5", "3.2", "3.3", "5.3"] },
    { "id": 5, "tasks": ["3.4", "3.5", "5.4", "5.7"] },
    { "id": 6, "tasks": ["3.6", "3.7", "5.5", "5.6", "5.8"] },
    { "id": 7, "tasks": ["3.8", "6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3", "8.1"] },
    { "id": 9, "tasks": ["6.4", "6.5", "6.6", "8.2", "8.5", "9.1"] },
    { "id": 10, "tasks": ["6.7", "8.3", "8.4", "8.6", "9.2"] },
    { "id": 11, "tasks": ["8.7", "9.3", "9.4", "10.1"] },
    { "id": 12, "tasks": ["10.2", "10.3", "10.4", "11.1"] },
    { "id": 13, "tasks": ["10.5", "11.2", "11.3"] },
    { "id": 14, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 15, "tasks": ["13.4", "13.5", "13.6", "13.7", "14.1"] },
    { "id": 16, "tasks": ["13.8", "14.2", "15.1"] },
    { "id": 17, "tasks": ["15.2", "15.3", "15.4", "16.1"] },
    { "id": 18, "tasks": ["15.5", "16.2", "16.3", "16.4"] },
    { "id": 19, "tasks": ["16.5", "16.6", "17.1", "17.2"] },
    { "id": 20, "tasks": ["17.3", "19.1", "19.2"] },
    { "id": 21, "tasks": ["19.3", "19.4", "20.1"] },
    { "id": 22, "tasks": ["20.2", "20.3", "21.1"] },
    { "id": 23, "tasks": ["21.2", "21.3", "21.4", "22.1"] },
    { "id": 24, "tasks": ["21.5", "22.2", "22.3", "23.1"] },
    { "id": 25, "tasks": ["22.4", "23.2", "23.3", "23.4"] },
    { "id": 26, "tasks": ["23.5", "25.1", "25.2"] },
    { "id": 27, "tasks": ["25.3", "25.4", "25.5", "26.1"] },
    { "id": 28, "tasks": ["26.2", "26.3", "27.1"] },
    { "id": 29, "tasks": ["27.2", "27.3", "27.4", "28.1"] },
    { "id": 30, "tasks": ["28.2", "28.3", "29.1"] },
    { "id": 31, "tasks": ["29.2", "29.3", "30.1"] },
    { "id": 32, "tasks": ["30.2", "30.3", "30.4", "30.5"] },
    { "id": 33, "tasks": ["32.1", "32.2", "32.3"] },
    { "id": 34, "tasks": ["32.4", "32.5"] }
  ]
}
```
