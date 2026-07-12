"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

type Role = "dosen" | "mahasiswa";

interface UserProfile {
  userId: string;
  name: string;
  username: string;
  role: Role;
}

interface RoleContextProps {
  currentRole: Role;
  user: UserProfile | null;
  toggleRole: () => void;
  logout: () => Promise<void>;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("dosen");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setCurrentRole(data.user.role);
      } else {
        setUser(null);
        if (pathname !== "/login") {
          window.location.href = "http://localhost:3000/oauth/authorize?client_id=lms-platform&redirect_uri=http://localhost:3004/api/auth/callback&response_type=code&code_challenge=mock_challenge&code_challenge_method=plain&scope=openid";
        }
      }
    } catch (err) {
      setUser(null);
      if (pathname !== "/login") {
        window.location.href = "http://localhost:3000/oauth/authorize?client_id=lms-platform&redirect_uri=http://localhost:3004/api/auth/callback&response_type=code&code_challenge=mock_challenge&code_challenge_method=plain&scope=openid";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, [pathname]);

  const toggleRole = () => {
    setCurrentRole((prev: Role) => (prev === "dosen" ? "mahasiswa" : "dosen"));
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
