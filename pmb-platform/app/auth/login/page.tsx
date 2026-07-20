"use client";

import { useEffect, useRef } from "react";

export default function PmbAuthLoginPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Redirect directly to Auth.js signin endpoint (same pattern as all other platforms).
    // Previously we redirected to /auth/login-start server route, but the extra server-hop
    // caused state/PKCE cookies to not be set properly in the Docker production runtime,
    // leading to "InvalidCheck: state value could not be parsed" on the callback.
    console.info("[pmb][auth][login][client] redirect to /api/auth/signin/unsia-sso");
    window.location.href = "/api/auth/signin/unsia-sso";
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}
