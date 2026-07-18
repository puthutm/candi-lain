# TODO - Fix OAuth INVALID (SSO portal utama)

## Plan
1. Update portal authorization link builder:
   - `sso-platform/app/home/page.tsx`: remove hardcoded `code_challenge` and generate real PKCE verifier/challenge per login attempt.
   - Encode/verpack `code_verifier` into `state` so callback can forward it securely (no hardcoded secrets).

2. Update authorization endpoint redirect behavior:
   - `sso-platform/app/oauth/authorize/route.ts`: decode the PKCE `state` payload and append `code_verifier` into redirect URL fragment (`#code_verifier=...`) so clients can pick it up without affecting `redirect_uri` strict string match.

3. Improve observability for the root cause:
   - `sso-platform/lib/services/oauth2.ts`: add safe logging when authorization code validation fails (especially `redirectUri` mismatch), without leaking secrets.

4. Test flow:
   - Run SSO portal and attempt redirect login to client app.
   - Confirm error `Authorization code validation failed: INVALID` is resolved.
   - If new error appears (e.g., `PKCE_MISMATCH`), iterate.

## Status
- [x] Step 1: Patch `sso-platform/app/home/page.tsx` (remove hardcoded PKCE; generate per-request PKCE; embed verifier into state)
- [x] Step 2: Patch `sso-platform/app/oauth/authorize/route.ts` (decode state; append verifier to redirect fragment)
- [x] Step 3: Patch `sso-platform/lib/services/oauth2.ts` (safe logging for INVALID reasons)
- [ ] Step 4: Test end-to-end OAuth authorization_code -> token exchange
