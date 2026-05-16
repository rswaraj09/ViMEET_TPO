"use client";

import { Suspense } from "react";
import { FacultyDashboard } from "@/views/faculty/Dashboard";

export default function Page() {
  return <Suspense><FacultyDashboard /></Suspense>;
}
