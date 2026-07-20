"use client";

import { useEffect, useRef } from "react";

export default function SsoLaunchPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    console.info("[pmb][auth][launch] redirect to /api/auth/signin/unsia-sso");
    // Redirect directly to Auth.js signin endpoint which properly sets state/PKCE cookies.
    window.location.href = "/api/auth/signin/unsia-sso";
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}

