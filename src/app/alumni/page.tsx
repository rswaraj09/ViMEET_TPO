"use client";

import { Suspense } from "react";
import { AlumniDashboard } from "@/views/alumni/Dashboard";

export default function Page() {
  return <Suspense><AlumniDashboard /></Suspense>;
}
