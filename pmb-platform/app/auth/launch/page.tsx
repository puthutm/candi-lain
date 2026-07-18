"use client";

import { useEffect, useRef } from "react";

export default function SsoLaunchPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    console.info("[pmb][auth][launch] redirect to /auth/login-start");
    // Server route /auth/login-start calls Auth.js signIn and creates state/PKCE cookies.
    window.location.href = "/auth/login-start";
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}
