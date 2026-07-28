import postgres from "postgres";

const ssoConnectionString = process.env.SSO_DATABASE_URL;

if (!ssoConnectionString) {
  console.warn("[SSO DB] SSO_DATABASE_URL is not set — SSO sync features will be unavailable.");
}

export const ssoClient = ssoConnectionString
  ? postgres(ssoConnectionString, { prepare: false })
  : null;
