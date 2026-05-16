"use client";

import { Suspense } from "react";
import { AdminDashboard } from "@/views/admin/Dashboard";

export default function Page() {
  return <Suspense><AdminDashboard /></Suspense>;
}
