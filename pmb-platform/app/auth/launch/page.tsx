"use client";

import { useEffect, useRef } from "react";

export default function SsoLaunchPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    console.info("[pmb][auth][launch] redirect to /auth/login");
    window.location.href = "/auth/login";
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}

