"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
  userId: string;
  name: string;
  username: string;
  role: string; // 'dosen' | 'verifikator_prodi' | 'verifikator_bpm' | 'admin_bank_konten'
}

interface RoleContextProps {
  currentRole: string;
  user: UserProfile | null;
  toggleRole: (role: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<string>("dosen");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const redirectToSSO = () => {
    window.location.href = "/api/auth/signin/unsia-sso";
  };

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setCurrentRole(data.user.role);
      } else {
        setUser(null);
        if (pathname !== "/login" && pathname !== "/api/setup") {
          redirectToSSO();
        }
      }
    } catch (err) {
      setUser(null);
      if (pathname !== "/login" && pathname !== "/api/setup") {
        redirectToSSO();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, [pathname]);

  const toggleRole = (role: string) => {
    setCurrentRole(role);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RoleContext.Provider value={{ currentRole, user, toggleRole, logout, loading, refreshSession }}>
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
