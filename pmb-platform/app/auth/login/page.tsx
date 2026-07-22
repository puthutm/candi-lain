"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

export default function PmbAuthLoginPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    console.info("[pmb][auth][login][client] calling signIn('unsia-sso')");
    signIn("unsia-sso");
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}
