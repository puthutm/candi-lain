"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface UserProfile {
  userId: string;
  name: string;
  username: string;
  role: string;
  roles?: string[];
}

interface RoleContextProps {
  user: UserProfile | null;
  currentRole: string;
  roles: string[];
  switchRole: (newRole: string) => void;
  toggleRole: () => void;
  logout: () => Promise<void>;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("mahasiswa");
  const [rolesList, setRolesList] = useState<string[]>(["mahasiswa", "dosen", "admin"]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        const userRoles: string[] = data.user.roles && data.user.roles.length > 0 
          ? data.user.roles 
          : [data.user.role || "mahasiswa"];
        setRolesList(userRoles);
        setCurrentRole(data.user.role || userRoles[0] || "mahasiswa");
      } else {
        setUser(null);
        if (pathname && !pathname.startsWith("/auth/")) {
          redirectToSSO();
        }
      }
    } catch (err) {
      setUser(null);
      if (pathname && !pathname.startsWith("/auth/")) {
        redirectToSSO();
      }
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole: string) => {
    setCurrentRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const toggleRole = () => {
    if (rolesList.length > 1) {
      const nextIdx = (rolesList.indexOf(currentRole) + 1) % rolesList.length;
      const nextRole = rolesList[nextIdx];
      if (nextRole) {
        switchRole(nextRole);
      }
    }
  };

  const redirectToSSO = () => {
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    if (pathname && pathname.startsWith("/auth/")) {
      setLoading(false);
      return;
    }
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
    <RoleContext.Provider
      value={{
        user,
        currentRole,
        roles: rolesList,
        switchRole,
        toggleRole,
        logout,
        loading,
        refreshSession,
      }}
    >
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
