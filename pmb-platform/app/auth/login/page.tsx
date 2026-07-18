"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

export default function PmbAuthLoginPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    console.info("[pmb][auth][login][client] starting signIn", {
      provider: "unsia-sso",
    });

    void signIn("unsia-sso", {
      callbackUrl: "/",
    });
  }, []);

  return <p>Mengarahkan ke SSO...</p>;
}
