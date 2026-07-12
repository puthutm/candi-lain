"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

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
    window.location.href = "http://localhost:3000/oauth/authorize?client_id=siakad-platform&redirect_uri=http://localhost:3003/api/auth/callback&response_type=code&code_challenge=mock_challenge&code_challenge_method=plain&scope=openid";
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
