# TODO - SSO /home 307 redirect + session stabilization

- [x] Investigate middleware/proxy redirect logic for `/home` and `/admin`
- [x] Inspect login cookie/session creation flow
- [x] Add env-controlled secure-cookie toggle for HTTP LAN deployments
- [x] Update login action cookie policy to use env toggle instead of NODE_ENV only
- [x] Add lightweight auth session debug endpoint (read-only)
- [x] Ensure docker-compose SSO env explicitly sets cookie toggle for current deployment mode
- [ ] Re-test key endpoints via curl:
  - [ ] `/admin` unauth redirect
  - [ ] `/home` unauth redirect
  - [ ] `/api/auth/session-debug` visibility of cookie/session state
- [ ] Ask user to verify browser login flow after rebuild/restart (server action stale cleanup)
