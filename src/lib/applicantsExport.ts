import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Job, JobApplication, ApplicationStatus } from "@/lib/api/jobs";
import { departmentLabel } from "@/lib/api/student";

function safeFileName(name: string) {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function buildRows(apps: JobApplication[]) {
  return apps.map((a, i) => ({
    "#": i + 1,
    Name: a.student.fullName,
    Email: a.student.emailId,
    "Student ID": a.student.studentId ?? "",
    Department: a.student.department ? departmentLabel(a.student.department) : "",
    Year: a.student.academicYear?.replace("_", " ") ?? "",
    CGPA: a.student.avgCgpa != null ? a.student.avgCgpa.toFixed(2) : "",
    Status: a.status,
    "Applied At": new Date(a.appliedAt).toLocaleDateString(),
    Resume: a.student.resumeUrl ?? "",
  }));
}

function fileTitle(job: Job, filter: ApplicationStatus | "") {
  const base = `${safeFileName(job.companyName)}_${safeFileName(job.jobTitle)}`;
  return filter ? `${base}_${filter.toLowerCase()}` : base;
}

export function exportApplicantsToExcel(
  job: Job,
  apps: JobApplication[],
  filter: ApplicationStatus | ""
) {
  const rows = buildRows(apps);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applicants");
  XLSX.writeFile(wb, `${fileTitle(job, filter)}_applicants.xlsx`);
}

export function exportApplicantsToPdf(
  job: Job,
  apps: JobApplication[],
  filter: ApplicationStatus | ""
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(13);
  doc.text(`${job.companyName} – ${job.jobTitle}`, 14, 16);
  doc.setFontSize(9);
  doc.text(
    `Package: ${job.package}  |  Location: ${job.location}  |  ${filter ? `Status: ${filter}  |  ` : ""}Total: ${apps.length}`,
    14,
    23
  );

  const rows = buildRows(apps);
  const columns = Object.keys(rows[0] ?? {}).filter((k) => k !== "Resume");

  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows.map((r) => columns.map((c) => r[c as keyof typeof r])),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [23, 23, 23] },
  });

  doc.save(`${fileTitle(job, filter)}_applicants.pdf`);
}
