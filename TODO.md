# TODO - Fix SSO login not redirecting after sign-in

- [ ] Review and make `sso-platform/lib/seed.ts` idempotent (no duplicate insert failures).
- [ ] Fix seed error handling in `sso-platform/lib/seed.ts` (do not swallow critical errors).
- [x] Update `sso-platform/app/actions.ts` to remove fragile seed dependency from login flow.
- [ ] Run validation command(s) in `sso-platform`.
- [ ] Summarize fix and expected behavior.
