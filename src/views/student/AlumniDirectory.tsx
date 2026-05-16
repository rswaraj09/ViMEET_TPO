import { StudentLayout } from "@/components/shared/StudentLayout";
import { AlumniDirectoryView } from "@/components/alumni/AlumniViews";

export function StudentAlumniDirectory() {
  return (
    <StudentLayout
      title="Alumni Directory"
      subtitle="Search alumni by department, batch, and company."
    >
      <AlumniDirectoryView />
    </StudentLayout>
  );
}
