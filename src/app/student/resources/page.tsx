"use client";

import { StudentLayout } from "@/components/shared/StudentLayout";
import { ResourcesView } from "@/components/resources/ResourcesView";

export default function StudentResourcesPage() {
  return (
    <StudentLayout
      title="Resources"
      subtitle="Question papers, syllabi, and forms for your department and year."
    >
      <ResourcesView canAdd={false} canDelete={false} />
    </StudentLayout>
  );
}
