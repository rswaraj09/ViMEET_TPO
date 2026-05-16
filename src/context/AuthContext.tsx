"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api/base";

export type Role = "STUDENT" | "ALUMNI" | "FACULTY" | "ADMIN";

export interface AuthUser {
  id: number;
  fullName: string;
  legalName?: string | null;
  emailId: string;
  role: Role;
  department?: string | null;
  academicYear?: string | null;
  studentId?: string | null;
  profilePic?: string | null;
  contactNo?: string | null;
  isHOD?: boolean;
  isVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handleTokenExpired = () => setUser(null);
    window.addEventListener("auth:token-expired", handleTokenExpired);
    return () => window.removeEventListener("auth:token-expired", handleTokenExpired);
  }, []);

  const login = (u: AuthUser) => setUser(u);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const roleLandingPath = (role: Role): string => {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "ALUMNI":
      return "/alumni";
    case "FACULTY":
      return "/faculty";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
};
