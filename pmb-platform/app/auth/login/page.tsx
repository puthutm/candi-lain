"use client";

import { useEffect, useRef } from "react";

export default function PmbAuthLoginPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    console.info("[pmb][auth][login][client] redirect to /auth/login-start");
    window.location.href = "/auth/login-start";
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}
