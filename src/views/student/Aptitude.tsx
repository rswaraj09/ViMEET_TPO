import { StudentLayout } from "@/components/shared/StudentLayout";
import { StudentAptitudeView } from "@/components/aptitude/StudentAptitude";

export function Aptitude() {
  return (
    <StudentLayout
      title="Aptitude tests"
      subtitle="Practice problems and scheduled assessments."
    >
      <StudentAptitudeView />
    </StudentLayout>
  );
}
