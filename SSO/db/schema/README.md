# Database Schema Documentation

This directory contains the complete database schema for the SSO Platform using Drizzle ORM.

## Schema Structure

### Core Tables

#### 1. Users & Authentication (`users.ts`)
- **users**: Core user information with authentication credentials
  - Stores username, email, password hash, full name, status
  - Status enum: active, inactive, locked
  - Supports MFA flag for future multi-factor authentication
  
- **user_identities**: External identity providers (Google, Microsoft, etc.)
  - Links users to external OAuth providers
  - Supports federated authentication in future phases

#### 2. Applications & Scopes (`applications.ts`)
- **applications**: OAuth2 client applications
  - Dynamic client registration without code deployment
  - Stores client_id, client_secret_hash, redirect URIs
  - Each application has an owner and status (active/inactive)
  
- **scopes**: OAuth2 scopes (openid, profile, email, custom scopes)
  - Global scope definitions
  
- **application_scopes**: Maps allowed scopes per application
  - Defines which scopes each application can request

#### 3. OAuth2 Runtime (`oauth.ts`)
- **oauth_authorization_codes**: Temporary authorization codes
  - 10-minute lifetime
  - Includes PKCE challenge for security
  - Single-use flag to prevent replay attacks
  
- **oauth_access_tokens**: JWT access tokens
  - 1-hour lifetime (configurable)
  - Stores token hash, not plaintext
  - Can be revoked
  
- **oauth_refresh_tokens**: Long-lived refresh tokens
  - 30-day lifetime (configurable)
  - Linked to access token
  - Supports token rotation
  
- **oauth_consents**: User consent for application access
  - Tracks what scopes user granted to which application
  - Can be revoked by user

#### 4. Dynamic RBAC (`rbac.ts`)
- **application_roles**: Application-specific roles
  - Each application defines its own roles
  - Role keys are unique per application
  - Supports default role assignment
  
- **permissions**: Granular permissions per application
  - Format: "resource:action" (e.g., "invoice:approve")
  - Unique per application
  
- **role_permissions**: Many-to-many mapping
  - Links roles to their permissions
  
- **user_application_roles**: User role assignments
  - User can have different roles in different applications
  - Status: active or revoked
  - Tracks who granted the role and when

#### 5. Reference Data (`reference.ts`)
- **ref_categories**: Master data categories
  - E.g., JABATAN (positions), STATUS_PEGAWAI (employee status)
  - Generic and reusable across ERP modules
  
- **ref_items**: Items within categories
  - Supports hierarchical structure (parent-child)
  - Flexible JSON extra_value field for custom attributes
  - Soft delete with is_active flag
  
- **organizations**: Organizational structure
  - Company > Division > Department > Unit hierarchy
  - Self-referencing for tree structure
  
- **user_organizations**: User assignments to org units
  - Links user to organization with optional position
  - Supports primary organization flag

#### 6. Audit Logging (`audit.ts`)
- **audit_logs**: Immutable audit trail
  - All security-relevant events logged
  - Includes actor, action, entity type, entity ID, metadata
  - Indexed for efficient querying
  - No updates or deletes allowed

### Enums (`enums.ts`)
- **user_status**: active, inactive, locked
- **application_status**: active, inactive
- **role_assignment_status**: active, revoked
- **organization_type**: company, division, department, unit

## Relationships

All relationships are defined in `relations.ts` using Drizzle's relation system:

### One-to-Many Relationships
- User → UserIdentities
- User → UserApplicationRoles
- User → OAuthConsents
- User → OAuthAuthorizationCodes
- Application → ApplicationRoles
- Application → ApplicationScopes
- RefCategory → RefItems
- Organization → SubOrganizations

### Many-to-Many Relationships
- Applications ↔ Scopes (via application_scopes)
- Roles ↔ Permissions (via role_permissions)

### Self-Referencing Relationships
- RefItem → ParentRefItem (hierarchical reference data)
- Organization → ParentOrganization (organizational hierarchy)

## Key Constraints

### Unique Indexes
- users: username, email
- user_identities: provider + provider_user_id
- applications: client_id
- scopes: code
- application_scopes: application_id + scope_id
- application_roles: application_id + role_key
- permissions: application_id + permission_key
- role_permissions: role_id + permission_id
- user_application_roles: user_id + application_id + role_id
- oauth_authorization_codes: code
- oauth_access_tokens: token_hash
- oauth_refresh_tokens: token_hash, access_token_id
- oauth_consents: user_id + application_id
- ref_categories: code
- ref_items: category_id + code
- organizations: code
- user_organizations: user_id + organization_id

### Foreign Keys with Cascade Delete
Most foreign keys use `onDelete: "cascade"` to ensure data integrity:
- When a user is deleted, all their identities, roles, tokens, and consents are deleted
- When an application is deleted, all its roles, scopes, tokens, and codes are deleted
- When a role is deleted, all its permission mappings and user assignments are deleted

### Check Constraints (Application-Level)
Some constraints are enforced in application logic:
- Password policy: min 8 chars, letters + numbers + symbols
- Role key format: alphanumeric + underscore only
- Permission key format: "resource:action"
- Redirect URI validation: HTTPS or http://localhost
- Only one primary organization per user

## Performance Indexes

### Audit Logs
- actor_user_id_idx
- action_idx
- entity_type_idx
- entity_id_idx
- created_at_idx

These indexes support efficient audit log queries by actor, action type, entity, and date range.

## Security Features

1. **Password Storage**: Bcrypt hashed, never stored in plaintext
2. **Token Storage**: Tokens stored as SHA256 hash, not plaintext JWT
3. **Client Secret**: Bcrypt hashed, displayed once on creation
4. **PKCE Support**: Required for all authorization code flows
5. **Token Revocation**: Explicit revocation flag checked on every token validation
6. **Audit Trail**: Complete immutable log of all security events

## Migration Strategy

Migrations are generated using Drizzle Kit:

```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate

# Studio for visual inspection
npm run db:studio
```

## Usage

Import the database client and schema:

```typescript
import { db } from "@/db";
import { users, applications, oauthAccessTokens } from "@/db/schema";
```

Example query:

```typescript
// Get user with all their roles for a specific application
const userWithRoles = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    applicationRoles: {
      where: eq(userApplicationRoles.applicationId, appId),
      with: {
        role: true,
      },
    },
  },
});
```

## Requirements Mapping

This schema fulfills requirements:
- **1.1, 1.2, 1.3**: User authentication with status checks
- **2.1**: Home dashboard support with user-application relationships
- **3.1, 3.2, 3.3**: OAuth2 authorization code flow with PKCE
- **4.1, 4.2, 4.3**: Token management (access, refresh, ID tokens)
- **5.1, 5.2**: Dynamic client registration
- **6.1, 6.2, 6.3**: Dynamic role management per application
- **7.1, 7.2**: Permission management
- **9.1, 9.2**: Consent management
- **10.1**: Reference data categories
- **11.1**: Reference data items with hierarchy
- **14.1**: Organization management
- **17.1**: Comprehensive audit logging

## Next Steps

After schema creation:
1. Run migrations to create tables in PostgreSQL
2. Seed initial data (default scopes: openid, profile, email)
3. Create Super Admin user for initial setup
4. Implement service layer for business logic
