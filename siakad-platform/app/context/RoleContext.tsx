"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  SSO_AUTHORIZE_URL,
  SSO_CLIENT_ID,
  SSO_CALLBACK_URL,
} from "@/lib/client-config";

interface UserProfile {
  userId: string;
  name: string;
  username: string;
  role: string;
}

interface RoleContextProps {
  user: UserProfile | null;
  logout: () => Promise<void>;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        redirectToSSO();
      }
    } catch (err) {
      setUser(null);
      redirectToSSO();
    } finally {
      setLoading(false);
    }
  };

  const redirectToSSO = () => {
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    document.cookie = `sso_code_verifier=${verifier}; path=/; max-age=600; SameSite=Lax`;
    window.location.href = `${SSO_AUTHORIZE_URL}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(SSO_CALLBACK_URL)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
  };

  useEffect(() => {
    refreshSession();
  }, [pathname]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      redirectToSSO();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RoleContext.Provider value={{ user, logout, loading, refreshSession }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
