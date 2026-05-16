"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const useLogout = () => {
  const { logout } = useAuth();
  const router = useRouter();
  return async () => {
    await logout();
    router.replace("/login");
  };
};
