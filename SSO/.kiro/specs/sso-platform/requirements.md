# Requirements Document: SSO Platform

## Introduction

SSO Platform adalah Identity Provider (IdP) internal berbasis OAuth2 Authorization Code Flow + PKCE yang menyediakan single sign-on untuk ekosistem ERP perusahaan. Platform ini terdiri dari dua modul utama yang terpisah namun terintegrasi:

1. **SSO Core**: Menyediakan otentikasi terpusat, OAuth2 flow, manajemen aplikasi klien dinamis, dan RBAC dinamis per aplikasi
2. **Data Referensi Module**: Modul standalone untuk master data yang dapat digunakan lintas aplikasi ERP dengan UI admin console terpisah

Setelah login berhasil, user diarahkan ke Home Dashboard yang menampilkan semua aplikasi yang mereka miliki akses, bukan langsung redirect ke satu aplikasi tertentu.

## Glossary

- **SSO_Platform**: Sistem Identity Provider yang menyediakan otentikasi dan otorisasi terpusat
- **OAuth2_Service**: Komponen yang mengimplementasikan OAuth2 Authorization Code Flow dengan PKCE
- **Authentication_Service**: Komponen yang mengelola login user dan session management
- **Token_Service**: Komponen yang mengelola lifecycle JWT tokens (issue, verify, revoke)
- **RBAC_Service**: Komponen yang mengelola dynamic role dan permission per aplikasi
- **Reference_Service**: Komponen standalone yang mengelola master data
- **Audit_Service**: Komponen yang mencatat seluruh aktivitas sistem
- **Home_Dashboard**: Portal yang menampilkan grid aplikasi setelah login
- **Admin_Console**: Interface untuk Super Admin mengelola SSO Platform
- **Reference_Admin_Console**: Interface standalone untuk mengelola Data Referensi Module
- **Client_App**: Aplikasi eksternal/internal yang terintegrasi dengan SSO Platform
- **Super_Admin**: User dengan hak akses penuh ke seluruh sistem
- **App_Owner**: User yang mengelola role dan permission untuk aplikasi tertentu
- **End_User**: User akhir yang menggunakan SSO untuk akses aplikasi
- **Authorization_Code**: Kode sementara yang ditukar dengan access token
- **Access_Token**: JWT token untuk akses resource
- **Refresh_Token**: Token untuk memperbaharui access token
- **ID_Token**: JWT token berisi profil user dan role
- **PKCE**: Proof Key for Code Exchange, mekanisme keamanan OAuth2
- **Code_Challenge**: Hash dari code_verifier untuk PKCE
- **Code_Verifier**: String random untuk validasi PKCE
- **Consent**: Persetujuan user untuk aplikasi mengakses data mereka
- **RefCategory**: Kategori master data (contoh: JABATAN, STATUS_PEGAWAI)
- **RefItem**: Item dalam kategori master data
- **Organization**: Unit kerja dalam struktur organisasi
- **Session**: Sesi login user yang aktif
- **JWKS**: JSON Web Key Set untuk distribusi public key

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As an End User, I want to authenticate with my credentials, so that I can securely access applications in the ecosystem.

#### Acceptance Criteria

1. WHEN an End_User submits valid credentials (username and password), THE Authentication_Service SHALL create a session and authenticate the user
2. WHEN an End_User submits invalid credentials, THE Authentication_Service SHALL reject the authentication and log the attempt
3. WHEN an End_User account status is "inactive" or "locked", THE Authentication_Service SHALL reject the authentication regardless of credential validity
4. WHEN an End_User successfully authenticates, THE Audit_Service SHALL log the login event with timestamp and user identifier
5. THE Authentication_Service SHALL hash all passwords using bcrypt or argon2 before storage
6. WHEN an End_User attempts to login, THE Authentication_Service SHALL enforce password policy of minimum 8 characters with combination of letters, numbers, and symbols

---

### Requirement 2: Home Dashboard Portal

**User Story:** As an End User, I want to see a dashboard with all applications I have access to after login, so that I can choose which application to use.

#### Acceptance Criteria

1. WHEN an End_User successfully authenticates via SSO, THE Home_Dashboard SHALL display a portal page instead of redirecting to a specific application
2. WHEN the Home_Dashboard loads, THE SSO_Platform SHALL retrieve all applications where the End_User has active role assignments
3. WHEN displaying applications, THE Home_Dashboard SHALL show each application with its name, logo, and description in a grid layout
4. WHEN an End_User clicks on an application in the Home_Dashboard, THE SSO_Platform SHALL initiate the OAuth2 authorization flow for that application
5. WHEN an End_User has no role assignments to any application, THE Home_Dashboard SHALL display an empty state message
6. WHEN the Home_Dashboard displays the greeting, THE SSO_Platform SHALL include the user's full name and appropriate time-based greeting (Selamat Pagi, Selamat Siang, Selamat Malam)

---

### Requirement 3: OAuth2 Authorization Flow

**User Story:** As a Client App, I want to obtain authorization from users via OAuth2 Authorization Code Flow with PKCE, so that I can securely access user data.

#### Acceptance Criteria

1. WHEN a Client_App initiates authorization, THE OAuth2_Service SHALL require code_challenge and code_challenge_method parameters (PKCE mandatory)
2. WHEN the OAuth2_Service receives an authorization request with valid parameters, THE OAuth2_Service SHALL display a consent screen to the End_User
3. WHEN an End_User grants consent, THE OAuth2_Service SHALL create an authorization code valid for 10 minutes
4. WHEN a Client_App exchanges an authorization code for tokens, THE OAuth2_Service SHALL validate the code_verifier against the stored code_challenge
5. IF the code_challenge_method is "S256", THEN THE OAuth2_Service SHALL verify that code_challenge equals BASE64URL(SHA256(code_verifier))
6. IF the code_challenge_method is "plain", THEN THE OAuth2_Service SHALL verify that code_challenge equals code_verifier
7. WHEN an authorization code is successfully exchanged, THE OAuth2_Service SHALL mark the code as used to prevent reuse
8. WHEN an authorization code is expired or already used, THE OAuth2_Service SHALL reject the token exchange request
9. WHEN a redirect_uri parameter does not match the application's registered redirect URIs, THE OAuth2_Service SHALL reject the authorization request

---

### Requirement 4: Token Management

**User Story:** As a Client App, I want to receive and manage JWT tokens, so that I can verify user identity and authorization.

#### Acceptance Criteria

1. WHEN an authorization code is successfully exchanged, THE Token_Service SHALL issue an access token valid for 1 hour
2. WHEN an authorization code is successfully exchanged, THE Token_Service SHALL issue a refresh token valid for 30 days
3. WHEN an authorization code is successfully exchanged, THE Token_Service SHALL issue an ID token containing user profile and roles for the requesting application
4. THE Token_Service SHALL sign all JWT tokens using RS256 algorithm
5. WHEN a Client_App requests token introspection, THE Token_Service SHALL return token status and metadata
6. WHEN a Client_App requests token revocation, THE Token_Service SHALL revoke the specified token and log the action
7. THE Token_Service SHALL store token hashes in the database, not plaintext tokens
8. WHEN a Client_App requests the JWKS endpoint, THE Token_Service SHALL return the public key for JWT verification
9. WHEN a refresh token is used to obtain a new access token, THE Token_Service SHALL validate the refresh token has not expired or been revoked
10. WHEN an access token is issued, THE Audit_Service SHALL log the TOKEN_ISSUED event with user and application identifiers

---

### Requirement 5: Dynamic Client Registration

**User Story:** As a Super Admin, I want to register new client applications dynamically, so that new applications can integrate with SSO without code deployment.

#### Acceptance Criteria

1. WHEN a Super_Admin creates a new application, THE SSO_Platform SHALL generate a unique client_id with 24 alphanumeric characters
2. WHEN a Super_Admin creates a new application, THE SSO_Platform SHALL generate a cryptographically secure client_secret with 32 random characters
3. WHEN a client_secret is generated, THE SSO_Platform SHALL display it once to the Super_Admin and store only the bcrypt hash
4. WHEN a Super_Admin registers an application, THE SSO_Platform SHALL require at least one redirect URI
5. WHEN a Super_Admin provides redirect URIs, THE SSO_Platform SHALL validate that URIs are valid HTTPS URLs or http://localhost for development
6. WHEN a Super_Admin activates or deactivates an application, THE SSO_Platform SHALL update the application status without deleting historical data
7. WHEN a Super_Admin creates an application, THE Audit_Service SHALL log the APPLICATION_CREATED event

---

### Requirement 6: Dynamic Role Management

**User Story:** As an App Owner, I want to define custom roles for my application, so that I can manage application-specific access control.

#### Acceptance Criteria

1. WHEN an App_Owner creates a new role, THE RBAC_Service SHALL require a role_key that is unique per application
2. WHEN an App_Owner creates a new role, THE RBAC_Service SHALL validate that the role_key contains only alphanumeric characters and underscores
3. WHEN an App_Owner creates a role, THE RBAC_Service SHALL allow specifying a display name, description, and default assignment flag
4. WHEN an App_Owner assigns a role to an End_User, THE RBAC_Service SHALL create a user_application_role record with status "active"
5. WHEN an App_Owner revokes a role from an End_User, THE RBAC_Service SHALL update the user_application_role status to "revoked"
6. WHEN a role assignment or revocation occurs, THE Audit_Service SHALL log the event with the granting/revoking admin identifier
7. WHEN an End_User has multiple active roles for an application, THE Token_Service SHALL include all role keys in the ID token
8. WHEN retrieving roles for a user, THE RBAC_Service SHALL return only roles with status "active"

---

### Requirement 7: Permission Management

**User Story:** As an App Owner, I want to define granular permissions and associate them with roles, so that I can implement fine-grained access control.

#### Acceptance Criteria

1. WHEN an App_Owner creates a permission, THE RBAC_Service SHALL require a permission_key that is unique per application
2. WHEN an App_Owner creates a permission, THE RBAC_Service SHALL validate that the permission_key follows the "resource:action" format
3. WHEN an App_Owner assigns a permission to a role, THE RBAC_Service SHALL create a role_permission record
4. WHEN an App_Owner removes a permission from a role, THE RBAC_Service SHALL delete the corresponding role_permission record
5. WHEN retrieving permissions for a user, THE RBAC_Service SHALL aggregate all permissions from the user's active roles for the specified application

---

### Requirement 8: User Information Endpoint

**User Story:** As a Client App, I want to retrieve authenticated user information, so that I can display user profile and enforce authorization.

#### Acceptance Criteria

1. WHEN a Client_App requests user info with a valid access token, THE Token_Service SHALL return user profile including sub, email, name, and preferred_username
2. WHEN a Client_App requests user info with a valid access token, THE Token_Service SHALL include all active roles for the requesting application
3. WHEN a Client_App requests user info with an invalid or expired access token, THE Token_Service SHALL return an error response
4. WHEN a Client_App requests user info with a revoked access token, THE Token_Service SHALL return an error response

---

### Requirement 9: Consent Management

**User Story:** As an End User, I want to review and manage application access permissions, so that I can control which applications can access my data.

#### Acceptance Criteria

1. WHEN an End_User authorizes an application for the first time, THE OAuth2_Service SHALL display a consent screen with application name and requested scopes
2. WHEN an End_User grants consent, THE OAuth2_Service SHALL create a consent record with the granted scopes and timestamp
3. WHEN an End_User has previously granted consent to an application, THE OAuth2_Service SHALL skip the consent screen for subsequent authorization requests
4. WHEN an End_User views their consent list, THE SSO_Platform SHALL display all applications with active consent including application name and granted scopes
5. WHEN an End_User revokes consent for an application, THE OAuth2_Service SHALL update the consent record with revoked_at timestamp
6. WHEN an End_User revokes consent for an application, THE Token_Service SHALL revoke all active tokens for that application
7. WHEN consent is granted or revoked, THE Audit_Service SHALL log the CONSENT_GRANTED or CONSENT_REVOKED event

---

### Requirement 10: Reference Data Module - Category Management

**User Story:** As a Super Admin, I want to manage reference data categories in a standalone module, so that I can provide master data for all ERP applications.

#### Acceptance Criteria

1. WHEN a Super_Admin creates a reference category, THE Reference_Service SHALL require a unique category code in uppercase format
2. WHEN a Super_Admin creates a reference category, THE Reference_Service SHALL require a display name and optional description
3. WHEN a Super_Admin updates a reference category, THE Reference_Service SHALL allow modifying the display name and description but not the code
4. WHEN a Super_Admin deletes a reference category, THE Reference_Service SHALL prevent deletion if the category contains active items
5. WHEN retrieving reference categories, THE Reference_Service SHALL return all categories ordered by creation date
6. WHEN a reference category is created or updated, THE Audit_Service SHALL log the REFERENCE_DATA_CREATED or REFERENCE_DATA_UPDATED event

---

### Requirement 11: Reference Data Module - Item Management

**User Story:** As a Super Admin, I want to manage reference data items with hierarchical support, so that I can maintain structured master data.

#### Acceptance Criteria

1. WHEN a Super_Admin creates a reference item, THE Reference_Service SHALL require a category identifier, item code, and display name
2. WHEN a Super_Admin creates a reference item with a parent, THE Reference_Service SHALL validate that the parent belongs to the same category
3. WHEN a Super_Admin creates a reference item, THE Reference_Service SHALL validate that the item code is unique within the category
4. WHEN a Super_Admin updates a reference item, THE Reference_Service SHALL allow modifying all fields except the category identifier
5. WHEN a Super_Admin deletes a reference item, THE Reference_Service SHALL set is_active to false instead of removing the record
6. WHEN retrieving items for a category, THE Reference_Service SHALL return items ordered by sort_order
7. WHEN retrieving hierarchical items, THE Reference_Service SHALL return a tree structure with parent-child relationships
8. WHEN a reference item has extra_value field, THE Reference_Service SHALL validate that the JSON size does not exceed 10KB

---

### Requirement 12: Reference Data Module - API Exposure

**User Story:** As a Developer of a Client App, I want to access reference data via public API, so that I can use consistent master data in my application.

#### Acceptance Criteria

1. WHEN a Client_App requests reference data by category code, THE Reference_Service SHALL return all active items in that category
2. WHEN a Client_App requests reference data with hierarchy, THE Reference_Service SHALL return items in tree structure format
3. WHEN a Client_App requests a non-existent category code, THE Reference_Service SHALL return a 404 not found response
4. THE Reference_Service SHALL expose the public API endpoint at /api/reference/{category_code}
5. WHEN a Client_App requests reference data, THE Reference_Service SHALL not require authentication for read operations

---

### Requirement 13: Reference Data Module - Standalone Admin Console

**User Story:** As a Super Admin, I want to access a dedicated admin console for reference data management, so that I can manage master data separately from SSO configuration.

#### Acceptance Criteria

1. THE SSO_Platform SHALL provide a standalone Reference_Admin_Console separate from the main Admin_Console
2. WHEN a Super_Admin accesses the Reference_Admin_Console, THE SSO_Platform SHALL display categories and items management interface
3. WHEN displaying reference data in the Reference_Admin_Console, THE SSO_Platform SHALL show category code, name, description, and item count
4. WHEN displaying items in the Reference_Admin_Console, THE SSO_Platform SHALL show hierarchical structure with parent-child indentation
5. WHEN a Super_Admin creates or edits items in the Reference_Admin_Console, THE SSO_Platform SHALL provide a form with all item fields including extra_value JSON editor
6. THE Reference_Admin_Console SHALL be deployable as a separate repository/module from SSO Core

---

### Requirement 14: Organization Management

**User Story:** As a Super Admin, I want to manage organizational structure, so that I can map users to their organizational units.

#### Acceptance Criteria

1. WHEN a Super_Admin creates an organization unit, THE Reference_Service SHALL require a unique organization code
2. WHEN a Super_Admin creates an organization unit with a parent, THE Reference_Service SHALL validate that the parent exists
3. WHEN a Super_Admin creates an organization unit, THE Reference_Service SHALL require specifying the type as "company", "division", or "department"
4. WHEN a Super_Admin assigns a user to an organization, THE Reference_Service SHALL allow specifying an optional position reference item
5. WHEN a Super_Admin assigns a user to an organization, THE Reference_Service SHALL allow marking it as the user's primary organization
6. WHEN a user is assigned to multiple organizations, THE Reference_Service SHALL ensure only one assignment has is_primary set to true
7. WHEN retrieving organization hierarchy, THE Reference_Service SHALL return a tree structure with all organizational units

---

### Requirement 15: Session Management

**User Story:** As an End User, I want my login session to be managed securely, so that my account remains protected.

#### Acceptance Criteria

1. WHEN an End_User successfully authenticates, THE Authentication_Service SHALL create a session with a unique session identifier
2. WHEN a session is created, THE Authentication_Service SHALL set an expiration time based on the configured session lifetime
3. WHEN an End_User makes a request with a session identifier, THE Authentication_Service SHALL validate that the session exists and has not expired
4. WHEN a session is expired, THE Authentication_Service SHALL reject the request and require re-authentication
5. WHEN an End_User logs out, THE Authentication_Service SHALL destroy the session and remove it from storage
6. WHEN a session is created or destroyed, THE Audit_Service SHALL log the event

---

### Requirement 16: Password Management

**User Story:** As an End User, I want to change my password, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN an End_User requests to change password, THE Authentication_Service SHALL require the current password for verification
2. WHEN an End_User provides an incorrect current password, THE Authentication_Service SHALL reject the password change request
3. WHEN an End_User provides a new password, THE Authentication_Service SHALL validate it meets the password policy requirements
4. WHEN a password change is successful, THE Authentication_Service SHALL hash the new password using bcrypt or argon2
5. WHEN a password is changed, THE Audit_Service SHALL log the password change event
6. WHEN a password is changed, THE Authentication_Service SHALL invalidate all existing sessions except the current one

---

### Requirement 17: Audit Logging

**User Story:** As a Super Admin, I want to view comprehensive audit logs, so that I can track all security-relevant events and changes.

#### Acceptance Criteria

1. THE Audit_Service SHALL log all authentication attempts including LOGIN_SUCCESS and LOGIN_FAILURE events
2. THE Audit_Service SHALL log all token operations including TOKEN_ISSUED and TOKEN_REVOKED events
3. THE Audit_Service SHALL log all administrative operations including APPLICATION_CREATED, APPLICATION_UPDATED, ROLE_CREATED, ROLE_ASSIGNED, and ROLE_REVOKED events
4. THE Audit_Service SHALL log all reference data changes including REFERENCE_DATA_CREATED and REFERENCE_DATA_UPDATED events
5. WHEN logging an event, THE Audit_Service SHALL record the actor user identifier, action type, entity type, entity identifier, and timestamp
6. WHEN logging an event, THE Audit_Service SHALL allow storing additional metadata as JSON
7. THE Audit_Service SHALL ensure all audit log entries are immutable (no updates or deletes allowed)
8. WHEN a Super_Admin queries audit logs, THE Audit_Service SHALL support filtering by actor, action type, entity type, and date range

---

### Requirement 18: Admin Console for SSO Management

**User Story:** As a Super Admin, I want to access an admin console for SSO configuration, so that I can manage applications, scopes, and system settings.

#### Acceptance Criteria

1. WHEN a Super_Admin accesses the Admin_Console, THE SSO_Platform SHALL display a dashboard with application management, scope management, and audit log sections
2. WHEN displaying applications in the Admin_Console, THE SSO_Platform SHALL show application name, client_id, status, owner, and creation date
3. WHEN a Super_Admin creates an application in the Admin_Console, THE SSO_Platform SHALL display the generated client_secret once with a warning that it cannot be retrieved again
4. WHEN a Super_Admin views an application in the Admin_Console, THE SSO_Platform SHALL display all registered redirect URIs, allowed scopes, and role statistics
5. WHEN a Super_Admin manages scopes in the Admin_Console, THE SSO_Platform SHALL display all available scopes with their descriptions

---

### Requirement 19: App Owner Console

**User Story:** As an App Owner, I want to access a console limited to my application, so that I can manage roles and user assignments for my application.

#### Acceptance Criteria

1. WHEN an App_Owner accesses the Admin_Console, THE SSO_Platform SHALL restrict visibility to only the applications they own
2. WHEN an App_Owner views their application, THE SSO_Platform SHALL display role management and user assignment sections
3. WHEN an App_Owner creates a role in the Admin_Console, THE SSO_Platform SHALL validate the role_key and display success confirmation
4. WHEN an App_Owner assigns a role to a user, THE SSO_Platform SHALL display a user search interface and role selection dropdown
5. WHEN an App_Owner views user assignments, THE SSO_Platform SHALL display user name, assigned roles, and grant date

---

### Requirement 20: Scope Management

**User Story:** As a Super Admin, I want to manage OAuth2 scopes, so that I can control what data applications can access.

#### Acceptance Criteria

1. WHEN a Super_Admin creates a scope, THE SSO_Platform SHALL require a unique scope code and description
2. WHEN a Super_Admin assigns scopes to an application, THE SSO_Platform SHALL ensure the application can only request assigned scopes
3. THE SSO_Platform SHALL provide default scopes "openid", "profile", and "email" for all applications
4. WHEN a Client_App requests scopes not assigned to it, THE OAuth2_Service SHALL reject the authorization request
5. WHEN displaying scopes in consent screen, THE OAuth2_Service SHALL show user-friendly descriptions for each requested scope

---

### Requirement 21: Client Credentials Rotation

**User Story:** As a Super Admin, I want to rotate client secrets, so that I can maintain security in case of credential compromise.

#### Acceptance Criteria

1. WHEN a Super_Admin requests client secret rotation, THE SSO_Platform SHALL generate a new cryptographically secure client_secret
2. WHEN a client secret is rotated, THE SSO_Platform SHALL display the new secret once and store only the hash
3. WHEN a client secret is rotated, THE SSO_Platform SHALL invalidate the old client secret immediately
4. WHEN a client secret is rotated, THE Audit_Service SHALL log the rotation event
5. WHEN a Client_App attempts to authenticate with an old rotated secret, THE OAuth2_Service SHALL reject the authentication

---

### Requirement 22: Token Introspection

**User Story:** As a Client App, I want to introspect tokens, so that I can validate token status and metadata.

#### Acceptance Criteria

1. WHEN a Client_App requests token introspection with a valid token, THE Token_Service SHALL return active status true with token metadata
2. WHEN a Client_App requests token introspection with an expired token, THE Token_Service SHALL return active status false
3. WHEN a Client_App requests token introspection with a revoked token, THE Token_Service SHALL return active status false
4. WHEN returning token introspection result, THE Token_Service SHALL include scope, client_id, username, token_type, expiration time, and subject
5. WHEN a Client_App requests token introspection, THE Token_Service SHALL require client authentication

---

### Requirement 23: Security Controls

**User Story:** As a Super Admin, I want the system to enforce security controls, so that the platform remains secure against common attacks.

#### Acceptance Criteria

1. THE SSO_Platform SHALL enforce HTTPS for all production endpoints
2. THE OAuth2_Service SHALL implement rate limiting on token endpoint to prevent brute force attacks
3. THE Authentication_Service SHALL lock user accounts after 5 consecutive failed login attempts
4. WHEN a user account is locked, THE Authentication_Service SHALL require admin intervention to unlock
5. THE Token_Service SHALL validate JWT signature on all token verification requests
6. THE OAuth2_Service SHALL validate redirect URI against registered URIs to prevent open redirect attacks
7. THE SSO_Platform SHALL set secure HTTP headers including HSTS, X-Frame-Options, and Content-Security-Policy

---

### Requirement 24: Error Handling

**User Story:** As a Developer, I want clear error responses, so that I can troubleshoot integration issues effectively.

#### Acceptance Criteria

1. WHEN an error occurs in OAuth2 flow, THE OAuth2_Service SHALL return error responses following RFC 6749 format with error code and description
2. WHEN a validation error occurs, THE SSO_Platform SHALL return HTTP 400 with detailed field-level error messages
3. WHEN an authentication error occurs, THE SSO_Platform SHALL return HTTP 401 with appropriate WWW-Authenticate header
4. WHEN an authorization error occurs, THE SSO_Platform SHALL return HTTP 403 with error description
5. WHEN a resource is not found, THE SSO_Platform SHALL return HTTP 404 with error message
6. WHEN a server error occurs, THE SSO_Platform SHALL return HTTP 500 and log the error details for investigation

---

### Requirement 25: Performance Requirements

**User Story:** As a Super Admin, I want the system to perform efficiently, so that user experience remains optimal.

#### Acceptance Criteria

1. WHEN a Client_App requests a token exchange, THE Token_Service SHALL respond within 300ms at 95th percentile
2. WHEN an End_User loads the Home_Dashboard, THE SSO_Platform SHALL retrieve and display applications within 500ms
3. WHEN a Client_App verifies a JWT token locally, THE Client_App SHALL complete verification within 50ms using the published JWKS
4. WHEN retrieving reference data via API, THE Reference_Service SHALL respond within 200ms for non-hierarchical queries
5. WHEN querying audit logs, THE Audit_Service SHALL return results within 1 second for date range queries up to 30 days

---

### Requirement 26: Data Retention and Archival

**User Story:** As a Super Admin, I want audit logs to be retained appropriately, so that compliance requirements are met without impacting performance.

#### Acceptance Criteria

1. THE Audit_Service SHALL retain audit logs in the primary database for 1 year
2. WHEN audit logs exceed 1 year age, THE Audit_Service SHALL archive them to cold storage
3. THE SSO_Platform SHALL retain revoked tokens records for 90 days for security investigation purposes
4. WHEN an End_User account is deactivated, THE SSO_Platform SHALL retain the user record and audit trail indefinitely
5. WHEN an application is deactivated, THE SSO_Platform SHALL retain application configuration and role definitions indefinitely

---

### Requirement 27: Multi-Application Role Support

**User Story:** As an End User, I want to have different roles across different applications, so that my access is appropriate for each application context.

#### Acceptance Criteria

1. WHEN an End_User is assigned roles, THE RBAC_Service SHALL allow multiple role assignments per application
2. WHEN an End_User accesses different applications, THE Token_Service SHALL include only the roles specific to the requesting application in the ID token
3. WHEN retrieving user info, THE Token_Service SHALL return roles scoped to the requesting application
4. WHEN an End_User has no roles for a requesting application, THE Token_Service SHALL return an empty roles array

---

### Requirement 28: Reference Data Versioning

**User Story:** As a Super Admin, I want reference data changes to be tracked, so that I can understand the history of master data modifications.

#### Acceptance Criteria

1. WHEN a reference item is updated, THE Reference_Service SHALL maintain the updated_at timestamp
2. WHEN a reference item is deactivated, THE Reference_Service SHALL preserve the item record with is_active set to false
3. WHEN retrieving reference data for applications, THE Reference_Service SHALL return only items where is_active is true
4. WHEN a Super_Admin views reference data history, THE Reference_Service SHALL display all modifications from audit logs

---

### Requirement 29: JWKS Publication

**User Story:** As a Client App, I want to retrieve public keys for JWT verification, so that I can verify tokens locally without calling SSO for each request.

#### Acceptance Criteria

1. THE Token_Service SHALL publish JWKS at the /.well-known/jwks.json endpoint
2. WHEN a Client_App requests JWKS, THE Token_Service SHALL return all currently valid public keys in JWK format
3. WHEN a key rotation occurs, THE Token_Service SHALL publish both old and new keys during the transition period
4. THE JWKS endpoint SHALL be publicly accessible without authentication
5. WHEN returning JWKS, THE Token_Service SHALL include key type, usage, key ID, algorithm, modulus, and exponent

---

### Requirement 30: Refresh Token Flow

**User Story:** As a Client App, I want to refresh access tokens without user interaction, so that users maintain seamless access.

#### Acceptance Criteria

1. WHEN a Client_App exchanges a refresh token, THE OAuth2_Service SHALL validate the refresh token has not expired
2. WHEN a Client_App exchanges a refresh token, THE OAuth2_Service SHALL validate the refresh token has not been revoked
3. WHEN a refresh token exchange is successful, THE Token_Service SHALL issue a new access token with the same scope as the original
4. WHEN a refresh token exchange is successful, THE Token_Service SHALL optionally issue a new refresh token (rotation)
5. IF refresh token rotation is enabled, THEN THE Token_Service SHALL revoke the old refresh token when issuing a new one
6. WHEN a refresh token is used, THE Audit_Service SHALL log the token refresh event

---
