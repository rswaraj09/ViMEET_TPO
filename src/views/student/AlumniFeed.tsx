import { StudentLayout } from "@/components/shared/StudentLayout";
import { AlumniFeedView } from "@/components/alumni/AlumniViews";

export function StudentAlumniFeed() {
  return (
    <StudentLayout
      title="Alumni Feed"
      subtitle="Mentorship offers, referrals, and career advice from our alumni."
    >
      <AlumniFeedView />
    </StudentLayout>
  );
}
